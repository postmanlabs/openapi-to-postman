# Spec contract testing

Turns the output of `convertV2WithTypes` into a contract-test collection: requests in a valid run order,
ids passed from one request to the next, a children-first teardown, and negative checks. Works from an
unmodified OpenAPI 3.x or Swagger 2.0 spec: no `links`, no chaining extensions, no spec order required.
Values are linked by name; a value no response returns becomes an empty collection variable for the caller
to set.

Public entry point: `buildContractTestCollection(conversion, options)` in `index.ts`, also on the default
export. Collection generation itself is unchanged; this is a pure post-step.

## Scope and boundaries

- openapi-to-postman takes the conversion result plus options and returns a collection and a summary. It
  does no file I/O.
- The caller (postman-cli's `postman spec test`) owns the command and its flags, reading the spec, saving the
  collection and keeping its variable values, checking that inputs are set, CI exit codes and running the
  collection.
- The input must come from `convertV2WithTypes(spec, { generateContractTests: true, parametersResolution:
  'Example' })`. A conversion without contract tests (no `CONTRACT_TEST_MARKER` in any test script) is
  rejected.

## Files

| File | Responsibility |
|---|---|
| `index.js` | Validates input, applies `exclude`, hashes the spec, wires the steps together, builds the summary |
| `operations.js` | Lists operations from `extractedTypes` and classifies each by path shape |
| `normalize.js` | Makes different spellings look alike: plurals, id names, wrappers, 3.1 types, maps, custom methods |
| `links.js` | Response fields, consumed values, variable names, linking by name |
| `order.js` | Run order: topological sort of resources, order within a resource, teardown; cycle errors |
| `collection.js` | Copies and wires requests, adds scripts, numbers them, builds the output collection |
| `scripts.js` | Postman script bodies (`exec` line arrays) |
| `utils.js` | Hashing, key sorting, request keys, JSON pointer to lodash path |

## Pipeline

1. **Validate.** `result: true`, non-empty `extractedTypes`, at least one script with `CONTRACT_TEST_MARKER`,
   valid `headers` and `exclude`. Otherwise `{ result: false, reason }`.
2. **Operations.** `listOperations` reads `extractedTypes` (`method/path` keys, JSON-string schemas) and
   matches each to its request in the collection.
3. **Exclude.** Operations matching an `exclude` entry are removed before anything else.
4. **Link.** `link` names every consumed value and finds the response field that fills it (see Links).
5. **Order.** `buildFlows` builds the run order from the links.
6. **Drop unordered consumers.** A consumer whose producer runs after it is unwired and reported in
   `errors`.
7. **Collection.** Requests are copied, wired, given scripts and numbered in run order; inputs are declared
   as empty collection variables.

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

## Links (`links.js`)

**Consumed values:** path parameters; required query and header parameters with an identifier-like name
(ending in `id`, `key`, `uuid`, `ref`, `slug`, `code` or `handle`), except headers the caller sends with
`headers`; top-level request body fields ending in `id`. Other parameters keep the spec's example.

**Variable names:** the parameter's name as written. A bare `{id}` is named after the resource it belongs to
(`/specifications/{id}` -> `specificationId`), headers are camel-cased (`X-Tenant-Id` -> `xTenantId`).
Consumers with the same variable name share one variable: naming is assumed consistent across the spec.

**Produced fields:** top-level scalar fields of every 2xx response, as JSON pointers, after `unwrap`. Arrays
and maps produce nothing. Deletes produce nothing.

**Candidates** for a variable, best first:

1. **Same name** (identifier-like names only): a field named like the variable, case and separators ignored.
   Creates first (`ROLE_RANK`), then a producer whose collection path is a prefix of a consumer's path, then
   producer key and pointer alphabetically.
2. **Create id:** the `id`, `uuid` or `<resource>Id` field returned by the create of the resource the
   variable identifies: the resource a path parameter belongs to, else the resource whose `<resource>Id` is
   the variable's name. Ties as above.

Types are not compared: a path, query or header value is a string in the request anyway.

**A request never fills a value it needs**, directly or through the values it needs. To guarantee that, the
run is simulated first: values no candidate returns are inputs from the start; a request runs once every
value it needs is available, and the requests that ran fill the values they return. When nothing can run,
one missing value becomes an input: one that unblocks a request on its own, else any, preferring a value no
create returns, then alphabetically. Then each variable takes its best candidate that doesn't need it. So
`ownerId` comes from `POST /owners`, not from `GET /pets/{petId}`, which echoes it but needs `petId`.

A link with `producer: null` is an **input**: the collection declares it as an empty collection variable and
the summary lists it with its consumers.

## Run order (`order.js`)

1. **Resource graph.** For every link whose consumer belongs to a different resource than its producer,
   add an edge producer resource -> consumer resource.
2. **Topological sort (Kahn's algorithm).** Resources with at least one edge go first: repeatedly take the
   first resource, alphabetically, whose dependencies are all placed. On a cycle, take the first remaining
   one; `dropUnorderedConsumers` reports the links this breaks in `errors`. Resources with no edges follow,
   alphabetically.
3. **Within a resource:** by `ROLE_RANK`, then path, then method.
4. **Teardown.** Deletes are taken out of the flows and placed last, in reverse resource order, so children
   go before parents. Each delete is followed by the resource's read with the variant `:expect-404`.

The result is `flows`: resource -> step ids (`operationId` or `operationId:expect-404`), plus `teardown`.
It's used internally. Spec order is never used anywhere.

## Collection (`collection.js`)

Requests are emitted in four phases, numbered `1.`, `2.`, ... only once included (no gaps):

1. **Flows**, every resource in order. Each step asserts `Flow | Succeeds (2xx)` and saves the values later
   steps need.
2. **No-token checks**, for every `GET` whose effective auth isn't `noauth` (or every `GET` when credential
   headers are given), sorted by key: sent with `noauth`, without credential headers and with the real linked
   ids, expecting 401 or 403. They run while the resources still exist, so a
   rejection can only be about the token.
3. **Missing-field checks**, for each create's required top-level body fields, sorted: the field is removed
   and a 4xx is expected. They run before the teardown, so parent ids still exist. If the resource has a
   delete linked to this create, a `DELETE … (clean up if created)` step follows. It runs only if the API
   wrongly accepted the request (the check saves the new id as `leaked_<variable>`).
4. **Teardown**: deletes, each followed by a read expecting 404 (`deleted_<variable>`).

**A request is left out only when excluded, or when a linked value has no place in it** (e.g. an XML body),
which is reported in `errors`. Every path parameter is linked or an input, so no request is sent with a
made-up id.

**Wiring** (`useVariable`): path variables, or an inline `{{name}}` before a custom method; query and header
entries (enabling the `<x>Type` sibling of a wired `<x>Id`); JSON body fields (non-string types unquoted);
form bodies (`urlencoded`, `formdata`). Optional query and header parameters are disabled unless a link fills
them.

**Scripts** (`scripts.js`):

| Script | Where | Does |
|---|---|---|
| `guard` | pre-request | Skips the request with a reason if a variable it needs is undefined, null or empty (`0` counts as set); a missing input also fails `Flow | <variable> is set` |
| `save` | test | On any 2xx, saves each value from the body and asserts `Flow | Saved <variable> from the response` |
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

**Other output details:** `headers` are sent on every request, replacing same-named spec headers; credential
headers replace the spec's auth and are left out of the no-token checks. Item ids are `ct-${hash(stepId)}`. `info._postman_id` is derived from the spec hash.
Request and response content is left exactly as the converter produced it. Inputs are added as empty
collection variables; values saved during the run are not declared.

## API

```js
convertV2WithTypes(spec, { generateContractTests: true, parametersResolution: 'Example' }, (err, conversion) => {
  const result = buildContractTestCollection(conversion, { exclude: ['* /internal/*'], headers: [{ name: 'X-Api-Key' }] });
});
```

| Option | Type | Effect |
|---|---|---|
| `exclude` | `string[]` | Operations not to run, as `METHOD /path`, where `*` matches anything (case-insensitive). An entry matching no operation is reported in `errors` |
| `headers` | `{ name, value? }[]` | Sent on every request; without a value, `{{camelCase(name)}}` (`X-Api-Key` -> `{{xApiKey}}`). Credential headers (Authorization, Proxy-Authorization, Cookie, or a name with token, key, secret, session or auth) replace the spec's auth and are left out of the no-token checks |

Result: `{ result: true, output: [{ type: 'collection', data }], summary }` or `{ result: false, reason }`.

| `summary` field | Contents |
|---|---|
| `excluded` | Operations left out by `exclude`, sorted |
| `links` | `{ variable, producer: { operation, value: $response.body#<pointer> }, consumers: [{ operation, param }] }` |
| `inputs` | `{ variable, consumers }` for values no response returns: empty collection variables to set |
| `errors` | Strings: an `exclude` entry matching nothing, a producer that can't run before its consumer, a value a request body has no place for |

Types: `ContractTestOptions` and `ContractTestResult` in `types/index.ts`.

## Key decisions

- **No spec edits, no config file.** Values are linked by name, assuming the spec names them consistently.
  What can't be linked is an input: a collection variable the user sets.
- **Two rules, no scores.** Same name, else create id. A wrong link can't be overridden; renaming in the
  spec or excluding the operation are the ways out.
- **Deterministic.** Fixed rules, fixed tie-breaks, alphabetical ordering, spec hash over sorted keys: the
  same spec gives the same collection however its paths and methods are laid out. Spec order is never used.
- **Run everything else.** No built-in exclusions (internal routes, aliases, bulk endpoints all run). A user
  who wants a request skipped excludes it.
- **Errors at generation time.** What would make the run wrong (cycles, unplaceable values, an `exclude`
  typo) is in `errors`, so the caller can refuse to run. Runtime guards remain for requests whose producer
  fails during the run, and for inputs the caller couldn't check.
- **Flat numbered list.** No folders or flow labels; numbering follows run order.
- **Saves on any 2xx**, since a spec may declare several success codes with the same body.
- **Known limitation:** values without a spec example are generated by the converter's faker and can differ
  between runs.

## postman-cli: `postman spec test <spec>`

The command that calls this module (`lib/commands/spec/test.ts` in postman-cli). `<spec>` is a local OpenAPI file
or a spec's cloud ID; specifications that are not OpenAPI exit 2.

| Flag | Effect |
|---|---|
| `-e, --environment`, `--env-var`, `--timeout-request` | As in `postman collection run` |
| `-H, --header <header>` | `Name: value` sent on every request, as in `postman request`; repeatable. Passed as `headers`. |
| `--exclude <operation>` | Repeatable; passed as `exclude` |
| `-n, --name <name>` | Collection name; default `<spec title> Contract Tests` |
| `--no-run` | Save the collection and list missing inputs only |
| `--api-key <key>` | Postman API key for a cloud spec or environment |

The collection is saved to `postman/collections/<name>` (`lib/commands/spec/contract-collection.ts`) and
regenerated on every run; only its variables are kept from the previous copy: all of them, with a user's edits, while a value
still as last generated (recorded in `.resources/generated-variables.yaml`) follows the spec. Its description marks
it as generated, and a directory without that mark is never overwritten. Before running, inputs still empty
in the collection, `--env-var` and a local `-e` file are listed with the requests that need them. The run
uses the saved copy. Exit codes: 0 passed or `--no-run`, 1 a check failed or an error, 2 not OpenAPI or a
bad flag, 3 auth failure, 8 nothing was run (`errors`, missing inputs, or a directory it didn't generate).

## Tests

- `test/unit/specContractTesting.test.js`, fixtures in `test/data/specContractTesting/` (`petstore`, `nested`,
  `patterns` for OpenAPI 3.1 naming and shape patterns, `swagger2`).
- **Invariants run on every fixture in that folder**, so a new fixture is covered automatically:
  - every linked value is saved before it's used, every input is declared, and both are guarded
  - every path id is linked
  - no-token and missing-field checks run before any teardown delete; no-token checks send no auth
  - each 404 check follows a delete of the same resource; children are deleted before parents
  - the same run order and collection id however the spec is laid out
  - adding an unrelated endpoint doesn't change existing links
  - summaries, descriptions and tags don't change the output
  - identical input gives identical output
- Run: `npx tsc` (after `index.ts` or `types` changes; tests load `dist/`), then
  `./node_modules/mocha/bin/mocha --timeout 90000 test/unit/specContractTesting.test.js`, `npm run test-lint`.

## Conventions

- Follow the module's style: `const` arrow-function chains, lodash, JSDoc on exported functions, max line
  length 120, no object spread (the ESLint parser rejects it).
- Comments only where behaviour isn't obvious. No spec order, randomness or time in anything that affects
  output.
- When changing linking, ordering or wiring, check that links, inputs and order are unchanged on all
  fixtures unless the change is intended, and add a fixture or test for the new pattern.

## Not covered yet

- OpenAPI `links` (the converter doesn't pass them or `operationId`s through `extractedTypes`).
- Ids from a `Location` header, creating with `PUT` and a client-chosen id, async `202` polling.
- Auth in a query string or cookie; XML bodies.
- Flagging ambiguous links (a tie decided alphabetically) for review.
- Overriding a link.
- In postman-cli: a Jest-style reporter, a read-only mode.
- A corpus run (e.g. APIs.guru) measuring crashes, coverage, ambiguity and precision against declared `links`.
