# Spec contract testing

Turns the output of `convertV2WithTypes` into a contract-test collection: requests in a valid run order,
ids passed from one request to the next, a children-first teardown, and negative checks. Works from an
unmodified OpenAPI 3.x or Swagger 2.0 spec: no `links`, no chaining extensions, no spec order required.
Links between requests are inferred and can be pinned or edited in a lock file.

Public entry point: `buildContractTestCollection(conversion, options)` in `index.ts`, also on the default
export. Collection generation itself is unchanged; this is a pure post-step.

## Scope and boundaries

- openapi-to-postman takes the conversion result plus options and returns a collection, a lock object and a
  summary. It does no file I/O.
- The caller (postman-cli, or the stand-in driver below) owns the command, reading and writing the lock
  file, environment variables, accepting links, CI exit codes and running the collection.
- The input must come from `convertV2WithTypes(spec, { generateContractTests: true, parametersResolution:
  'Example' })`. A conversion without contract tests (no `CONTRACT_TEST_MARKER` in any test script) is
  rejected.

## Files

| File | Responsibility |
|---|---|
| `index.js` | Validates input, reads `exclude`, hashes the spec, wires the steps together, builds the summary |
| `operations.js` | Lists operations from `extractedTypes` and classifies each by path shape |
| `normalize.js` | Makes different spellings look alike: plurals, id names, wrappers, 3.1 types, maps, custom methods |
| `bindings.js` | Response fields, consumed values, ranked rules, inference |
| `lock.js` | `exclude`, checks on hand-edited bindings, reconciling a saved lock with fresh inference, warnings |
| `order.js` | Run order: topological sort of resources, order within a resource, teardown |
| `collection.js` | Copies and wires requests, adds scripts, numbers them, builds the output collection |
| `scripts.js` | Postman script bodies (`exec` line arrays) |
| `utils.js` | Hashing, key sorting, request keys, JSON pointer to lodash path |

## Pipeline

1. **Validate.** `result: true`, non-empty `extractedTypes`, at least one script with `CONTRACT_TEST_MARKER`,
   valid `exclude` entries. Otherwise `{ result: false, reason }`.
2. **Operations.** `listOperations` reads `extractedTypes` (`method/path` keys, JSON-string schemas) and
   matches each to its request in the collection.
3. **Exclude.** Operations matching the lock's `exclude` section are removed before anything else.
4. **Reconcile.** Saved bindings that still fit are kept; the rest is inferred (see Lock file).
5. **Order.** `buildFlows` builds the run order from the active bindings.
6. **Drop unusable consumers.** Consumers whose producer runs after them (a cycle), or whose producer is
   itself skipped, are listed as unresolved (repeated until nothing changes).
7. **Collection.** Requests are copied, wired, given scripts and numbered in run order.

## Operations and classification (`operations.js`)

- Key: `METHOD /path` (e.g. `POST /pets`). Request lookup uses `requestKey`/`itemKey`, which write path
  parameters as `:name`. Server-template segments such as `/:version/pets` are left as they are.
- `operationId`: `${method}${path with non-alphanumerics as _}` (e.g. `post_pets`). If two paths produce the
  same id (`/a-b`, `/a_b`), each gets `_${hash(key, 6)}`.
- Role by method and whether the path ends in a parameter (an item) or not (a collection):

  | | POST | GET | PUT / PATCH | DELETE |
  |---|---|---|---|---|
  | collection | create | list | other | other |
  | item | other | read | update | delete |

- A trailing static segment that isn't a plural noun, after an item or a collection, is an action or a
  singleton of the resource before it, role `other`: `/orders/{id}/cancel`, `/users/{id}/avatar`,
  `/users/search`, `/specifications/{id}/definition`. So is a custom method: `/orders/{id}:cancel`.
- Resource: the singular of the last static segment of the owner path (`root` if none).
- Parameter ownership: a path parameter belongs to the resource named by the segment before it
  (`/specifications/{id}/files/{fileId}` -> `{ id: specification, fileId: file }`). In a composite key
  (`/repos/{owner}/{repo}`) or at the start of the path, it names itself (`{repoId}` -> `repo`).
- `ROLE_RANK`: create 0, list 1, read 2, update 3, other 4, delete 5.

## Normalisation (`normalize.js`)

| Function | Does |
|---|---|
| `singular` | Irregular table (people, children, indices, statuses, ...), then `-ies`, `-yses`, keeps `-ss/-us/-is`, strips `-es` after sibilants, else trailing `s` |
| `isCollection` | A segment whose singular differs from it |
| `isIdField(name, resource)` | `id`, `uuid`, `<resource>Id`, `<resource>_id` (case and separators ignored) |
| `normalizeType` | OpenAPI 3.1 `[string, null]` -> `string` |
| `isMap` | `additionalProperties` without properties, or example-derived keys (`task_id`, `task_id1`, `task_id2`) |
| `unwrap` | Up to two wrapper levels: `data`, `items`, `results`, `result`, `records`, `payload`, `content`, and HAL `_embedded` when it holds a single relation |
| `splitCustomMethod` | `{id}:cancel` -> `{id}` + `cancel` |

## Links (`bindings.js`)

**Produced fields:** scalar fields of every 2xx response, as JSON pointers, after `unwrap`. Arrays contribute
their first item (`/0`), maps are skipped, depth is capped at 3.

**Consumed values:** path parameters; required query and header parameters; optional ones typed by a sibling
`<x>Type` parameter (`entityId` + `entityType`); top-level request body fields ending in `id`.

**Candidates** must be a different operation, of a compatible type and format, and must not themselves need an
id of the consumer's resource (`GET /tasks/{taskId}` can never feed `GET /tasks`).

**Rules**, highest evidence first. `MIN_SCORE` is 60.

| Rule | Score | Matches when |
|---|---|---|
| `same-resource-create` | 90 | The producer creates the resource that owns the path parameter; the field is its id (or has the parameter's name); top level |
| `typed-reference` | 85 | The consumer's `<x>Type` sibling names the producer's resource; the producer creates it; id field; top level |
| `other-resource-create` | 80 | The producer is a create; id field; top level; the consumer is named `<producerResource>Id` |
| `same-resource-list` | 70 | The producer lists the resource that owns the path parameter; id field of the first item (`/0/id`) |
| `exact-name` | 60 | Same name, identifier-like (`id`, `key`, `uuid`, `ref`, `slug`, `code`, `handle` suffix), top level, producer not a delete, and the consumer isn't a reference to a resource that has a create |

**Ties**, in order: higher score; the producer's collection path is a prefix of the consumer's path; create
before list (`ROLE_RANK`); shallower field; producer key, then pointer, alphabetically.

Consumers matched to the same field share one binding and one collection variable. Variable names: id fields
become `<resource>_id`, others the field name in snake case; the lock adds `_2`, `_3` on clashes.

## Run order (`order.js`)

1. **Resource graph.** For every binding whose consumer belongs to a different resource than its producer,
   add an edge producer resource -> consumer resource.
2. **Topological sort (Kahn's algorithm).** Resources with at least one edge go first: repeatedly take the
   first resource, alphabetically, whose dependencies are all placed. On a cycle, take the first remaining
   one; the links this breaks are reported by `lock.js` as unresolved. Resources with no edges follow,
   alphabetically.
3. **Within a resource:** by `ROLE_RANK`, then path, then method.
4. **Teardown.** Deletes are taken out of the flows and placed last, in reverse resource order, so children
   go before parents. Each delete is followed by the resource's read with the variant `:expect-404`.

The result is `flows`: resource -> step ids (`operationId` or `operationId:expect-404`), plus `teardown`.
It's used internally and not written to the lock. Spec order is never used anywhere.

## Collection (`collection.js`)

Requests are emitted in four phases, numbered `1.`, `2.`, ... only once included (no gaps):

1. **Flows**, every resource in order. Each step asserts `Flow | Succeeds (2xx)` and saves the values later
   steps need.
2. **No-token checks**, for every `GET` whose effective auth isn't `noauth`, sorted by key: sent with
   `noauth` and the real linked ids, expecting 401 or 403. They run while the resources still exist, so a
   rejection can only be about the token.
3. **Missing-field checks**, for each create's required top-level body fields, sorted: the field is removed
   and a 4xx is expected. They run before the teardown, so parent ids still exist. If the resource has a
   delete linked to this create, a `DELETE … (clean up if created)` step follows. It runs only if the API
   wrongly accepted the request (the check saves the new id as `leaked_<variable>`).
4. **Teardown**: deletes, each followed by a read expecting 404 (`deleted_<variable>`).

**A request is left out (`summary.skipped`) only when a value it needs is unresolved:** a path id with no
link, or a linked value the request can't take (e.g. an XML body). Both are listed under `unresolved`. The
lock's `exclude` section is the only other way a request is left out.

**Wiring** (`useVariable`): path variables, or an inline `{{name}}` before a custom method; query and header
entries (enabling the `<x>Type` sibling of a wired `<x>Id`); JSON bodies (non-string types unquoted); form
bodies (`urlencoded`, `formdata`). Optional query and header parameters are disabled unless a binding fills
them.

**Scripts** (`scripts.js`):

| Script | Where | Does |
|---|---|---|
| `guard` | pre-request | Skips the request with a reason if a variable it needs is undefined, null or empty (`0` counts as set) |
| `save` | test | On any 2xx, saves each value (body path or header, optionally narrowed by `pattern`) and asserts `Flow | Saved <variable> from the response` |
| `expectSuccess` | test | `Flow | Succeeds (2xx)` |
| `markDeleted` | test | On 2xx, keeps the ids as `deleted_<variable>` and clears the originals |
| `expectGone` | test | `Flow | Deleted resource is gone (404)` |
| `expectNoTokenRejected` | test | 401 or 403 |
| `expectMissingFieldRejected` | test | 4xx |
| `captureCreated`, `clear` | test | Keep and clear `leaked_<variable>` for the cleanup step |

The converter's own contract test script (status declared, body matches schema) is kept on every flow step.

**Request values:** the converter fills requests from the spec's examples, falling back to values generated
from the schema (strings become `"string"`, numbers are random). This module only replaces linked values with
`{{variable}}` and removes the field in missing-field checks.

**Other output details:** `authHeader` sets collection-level API key auth, removes same-named request headers
and request-level auth. Item ids are `ct-${hash(stepId)}`. `info._postman_id` is derived from the spec hash.
Request and response content is left exactly as the converter produced it. Binding variables are added as
empty collection variables (environment-backed ones aren't).

## Lock file (`lock.js`)

Optional input, always returned. Reading and writing the file is the caller's job. It holds only what a user
reads or edits; explanations (rules, scores, reasons) go in the summary.

```yaml
lockfileVersion: 1
exclude:                                           # operations not to run
  - operation: POST /pets/{petId}/duplicate        #   exact "METHOD /path"
  - pattern: '^\w+ /internal/'                     #   or a regex on "METHOD /path"
bindings:
  - variable: pet_id                               # collection variable
    producer:                                      # a response field (any 2xx) ...
      operation: POST /pets
      value: $response.body#/id
    consumers:
      - operation: GET /pets/{petId}
        param:
          in: path
          name: petId
      - operation: POST /visits
        param:
          in: body                                 # also query, header; body paths may be nested
          path: /petId
  - variable: photo_id
    producer:
      operation: POST /pets/{petId}/photos
      value: $response.header.Location             # ... or a response header,
      pattern: ([^/]+)$                            #   optionally narrowed to a regex's first capture group
    consumers:
      - ...
  - variable: workspace_id
    note: the workspace the tests run in           # optional, kept as written
    producer:
      environment: workspaceId                     # ... or an environment variable
    consumers:
      - ...
  - variable: store_id
    producer:
      operation: POST /stores
      value: $response.body#/data/id
      constant: e43483a8-8e79-4f7f-b710-762ff4f7b4d0   # any producer: this value is used instead
    consumers:
      - ...
  - variable: container_id
    producer: null                                 # nothing returns this value: set a producer to resolve it
    consumers:
      - operation: POST /specifications
        param:
          in: query
          name: containerId
```

**Producer forms:** `operation` + `value` (+ `pattern`), `environment`, or `null`. Any of them may add
`constant`: every consumer then gets that value (a collection variable), the producer request doesn't save into
the variable or affect run order, and the rest of the producer is a reference only (not checked).
`operation` and `environment` aren't combined. Header values are only checked for their operation, since the
converter's output doesn't describe response headers.

**Checked before generating** (each returns `{ result: false, reason }`):
- `lockfileVersion` is not 1 (a missing version counts as 1): `Unsupported lockfileVersion 2: expected 1`
- an `exclude` entry has both or neither of `operation`/`pattern`, or an invalid regex
- a binding without a `variable`, or two bindings with the same `variable`
- a producer that is not null, `operation` + `value`, `environment` or `constant`
- a consumer that is not `{ operation, param: { in: path|query|header, name } | { in: body, path } }`, or one
  listed under two bindings (placeholders included)

**Reconcile.** Everything already in the lock belongs to the user: a run only appends.

1. Every saved binding, placeholders included, is kept as written and in its order. Comments and unknown keys
   are dropped, and keys are written in a standard order.
2. Problems with saved bindings are reported in `summary.warnings` and change nothing in the lock:
   - `producer X is excluded` / `producer X is not in the spec` / `X does not return <pointer>`: the
     binding's consumers get no value this run (a path id skips the request, other values use the example)
   - `consumer X is not in the spec` / `X has no path parameter Y`: nothing to run for it
   - `types of <value> and Y differ`: still used

   Excluded consumers are ignored. Query, header and body consumers may target parameters the spec doesn't
   declare; a path parameter must exist. A `constant` makes the rest of the producer a reference only.
3. Consumers listed anywhere in the lock are never inferred again. Deleting a binding or a consumer is how a
   user asks for a fresh link.
4. New consumers are inferred. One whose producer (operation and value) matches a saved binding joins it
   (`extended`); other links are appended, sorted by producer operation then variable (`added`, with `rule`
   and `score`).
5. New values nothing returns join the saved placeholder with the same variable name (`<resource>_id` for a
   path `{id}`, else the parameter name in snake case), or become a new one appended at the end.
6. A placeholder value that a response can now provide is reported in `summary.suggestions`; the user sets
   the producer.
7. Flows are built from the saved and added bindings; consumers broken by a cycle or by a skipped producer are
   reported in `summary.unresolved`.

Review happens on the lock file's diff; `--frozen-lockfile` stops CI when something would be added.

**Unresolved reasons** (`summary.unresolved`, each with `fallback: skip` or `example`):
`no response returns a matching value`, `no producer is set for this value`, `binding X: <producer problem>`,
`X runs after this request (dependency cycle)`, `X is skipped (it needs an unresolved value)`,
`the request body format cannot take a linked value`.

## API

```js
convertV2WithTypes(spec, { generateContractTests: true, parametersResolution: 'Example' }, (err, conversion) => {
  const result = buildContractTestCollection(conversion, { lock, authHeader: 'x-access-token' });
});
```

| Option | Type | Effect |
|---|---|---|
| `lock` | object | Saved lock: bindings reused, placeholders recomputed, `exclude` applied |
| `authHeader` | string | Header sent on every request, valued `{{camelCase(header)}}` (`x-access-token` -> `{{xAccessToken}}`) |

Result: `{ result: true, output: [{ type: 'collection', data }], lock, summary }` or `{ result: false, reason }`.

| `summary` field | Contents |
|---|---|
| `excluded` | Operations left out by `exclude`, sorted |
| `skipped` | Operations left out because a value they need is unresolved |
| `unchanged` | Number of saved bindings, placeholders included |
| `added` | Bindings appended: new links (with `rule` and `score`) and new placeholders |
| `extended` | `{ variable, consumer }` for consumers joined to a saved binding |
| `warnings` | `{ variable, reason }` for problems with saved bindings |
| `suggestions` | `{ variable, consumer, producer }` for placeholder values a response can now provide |
| `unresolved` | `{ operation, param, reason, fallback }` for every value that isn't linked |

Types: `ContractTestOptions` and `ContractTestResult` in `types/index.ts`.

## Key decisions

- **No spec edits and no UI.** Links are inferred; the lock file is the only place to add or override them.
- **A minimal lock file.** Only `exclude` and `bindings` (`variable`, `producer`, `consumers`). Unresolved
  values appear as bindings with `producer: null`, right where a user resolves them. No statuses, rules,
  scores, hashes or run order in the file.
- **Deterministic.** Fixed rules, fixed tie-breaks, alphabetical ordering, spec hash over sorted keys: the
  same spec gives the same collection however its paths and methods are laid out. Spec order is never used.
- **Cautious when unsure.** Below the minimum score a value stays unresolved rather than guessed. A request
  with an unresolved path id is left out rather than sent with a made-up id.
- **Run everything else.** No built-in exclusions (internal routes, aliases, bulk endpoints all run when
  their values resolve). A user who wants a request skipped lists it under `exclude`.
- **Every skip is explained at generation time** (`summary.unresolved` with `fallback: skip`, and a
  `producer: null` binding for the root cause), not discovered at run time. Runtime guards remain only for requests whose producer fails during the run.
- **Flat numbered list.** No folders or flow labels; numbering follows run order.
- **Saves on any 2xx**, since a spec may declare several success codes with the same body.
- **Known limitation:** values without a spec example are generated by the converter's faker and can differ
  between runs.

## Stand-in driver (until postman-cli has the commands)

`~/Desktop/postman/spec-contract-testing-driver/run.js`:

| Flag | Effect |
|---|---|
| `--spec <file>` | Spec to generate from (required) |
| `--out <file>` | Where to write the collection (required) |
| `--lock <file>` | Read a saved lock |
| `--write-lock <file>` | Write the merged lock as expanded YAML, with a short comment header |
| `--frozen-lockfile` | Exit 1 if any link would be added |
| `--auth-header <name>` | Passed as `authHeader` |

Exit codes: 2 bad usage or spec that won't convert, 1 frozen-lockfile violation, 0 otherwise.

`ct.sh` shortcuts: `ct-gen [spec]`, `ct-run [postman collection run flags]`, `ct` (both). Settings:
`CT_SPEC`, `CT_OUT`, `CT_LOCK`, `CT_AUTH_HEADER`, `CT_BASE_URL` (`baseUrl`), `CT_WORKSPACE` (`workspaceId`),
`CT_TOKEN_FILE` (`xAccessToken`). `shuffle-spec.js <in> <out> [seed]` writes a copy with paths and methods
shuffled.

## Tests

- `test/unit/specContractTesting.test.js`, fixtures in `test/data/specContractTesting/` (`petstore`, `nested`,
  `patterns` for OpenAPI 3.1 naming and shape patterns, `swagger2`).
- **Invariants run on every fixture in that folder**, so a new fixture is covered automatically:
  - every linked value is saved before it's used, and guarded
  - every path id is linked
  - no-token and missing-field checks run before any teardown delete; no-token checks send no auth
  - each 404 check follows a delete of the same resource; children are deleted before parents
  - the same run order and collection id however the spec is laid out
  - adding an unrelated endpoint doesn't change existing links
  - summaries, descriptions and tags don't change the output
  - feeding the returned lock back changes nothing
  - identical input gives identical output
- Run: `npx tsc` (after `index.ts` or `types` changes; tests load `dist/`), then
  `./node_modules/mocha/bin/mocha --timeout 90000 test/unit/specContractTesting.test.js`, `npm run test-lint`.

## Conventions

- Follow the module's style: `const` arrow-function chains, lodash, JSDoc on exported functions, max line
  length 120, no object spread (the ESLint parser rejects it).
- Comments only where behaviour isn't obvious. No spec order, randomness or time in anything that affects
  output.
- When changing rules, scores, ordering or wiring, check that bindings and order are unchanged on all
  fixtures unless the change is intended, and add a fixture or test for the new pattern.

## Not covered yet

- OpenAPI `links` (the converter doesn't pass them or `operationId`s through `extractedTypes`).
- Ids only in a `Location` header, creating with `PUT` and a client-chosen id, async `202` polling.
- Auth in a query string or cookie; XML bodies.
- Flagging ambiguous links (a tie decided alphabetically) for review.
- postman-cli commands (`spec test`, `spec generate contract-tests`), lock I/O there, a Jest-style reporter,
  a read-only mode.
- A corpus run (e.g. APIs.guru) measuring crashes, coverage, ambiguity and precision against declared `links`.
