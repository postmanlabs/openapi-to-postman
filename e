[33mcommit 2ac569c518dc89b3697a04a6b5b3ffc064c59275[m[33m ([m[1;36mHEAD -> [m[1;32maddingPaths[m[33m)[m
Author: AchyutAV <achyut.rymec@gmail.com>
Date:   Thu Aug 13 15:57:42 2020 +0100

    adding paths

[33mcommit 5d190efbf00be2c0d90d28422d0e06d51d277398[m[33m ([m[1;31morigin/develop[m[33m, [m[1;31morigin/addingPaths[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Merge: 19df02d 34b9ef5
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Aug 10 13:54:03 2020 +0530

    Merge branch 'release/1.2.6' into develop

[33mcommit 34b9ef56cf98f30ab6fdbc160ded207e16befe5a[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Aug 10 13:53:13 2020 +0530

    Released v1.2.6

[33mcommit 19df02dc4efb461952a60693e3f0da2c506fb629[m
Merge: cffac40 02c2cfa
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Mon Aug 10 13:43:06 2020 +0530

    Merge pull request #263 from postmanlabs/feature/validation-test
    
    Added validation tests to improve code coverage.

[33mcommit cffac402de8402bb33fd8c8aa70579ce84acea52[m
Merge: 6c79465 adbd783
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Mon Aug 10 13:11:25 2020 +0530

    Merge pull request #270 from postmanlabs/feature/fix-hybrid-pathsegment-validation
    
    Fixed an issue where transaction was not matching if path had segment with fix and variable parts during valiadtion.

[33mcommit 6c7946536397ba0d549885e2042f4e2a73989fa2[m
Merge: ce3bad5 e48cb6b
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Sun Aug 9 20:39:39 2020 +0530

    Merge pull request #178 from postmanlabs/dependabot/npm_and_yarn/acorn-6.4.1
    
    Bump acorn from 6.3.0 to 6.4.1

[33mcommit ce3bad524ccab8bc7969aadcf22ddb907cafa561[m
Merge: a1d6eda 25081a1
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Sun Aug 9 20:34:44 2020 +0530

    Merge pull request #260 from postmanlabs/dependabot/npm_and_yarn/lodash-4.17.19
    
    Bump lodash from 4.17.13 to 4.17.19

[33mcommit 02c2cfa7db45ba17c65e4be9490bf523bb5ad9ec[m[33m ([m[1;31morigin/feature/validation-test[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Aug 7 19:55:53 2020 +0530

    Updated test to be agnostic of fixture

[33mcommit adbd7835800dfacf097bc37b6a11b31e69097ef3[m[33m ([m[1;31morigin/feature/fix-hybrid-pathsegment-validation[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Aug 7 18:28:30 2020 +0530

    Added regression tests for fixed hybrid path segment matching flow

[33mcommit 361b9951c546be9ba9eb791c43826b9c6973d02d[m
Merge: 5dff346 a1d6eda
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Aug 7 17:21:20 2020 +0530

    Merge branch 'develop' of github.com:postmanlabs/openapi-to-postman into feature/fix-hybrid-pathsegment-validation

[33mcommit a1d6eda83ccd43cce092de5c96628b12ce473bcf[m
Merge: 7597142 4ee4e36
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Fri Aug 7 17:14:00 2020 +0530

    Merge pull request #265 from postmanlabs/feature/fix-invalid-deserialisation
    
    Fixed issue where invalid deserialisation was happening for param style matrix.

[33mcommit 7597142d34bd39b33369cf083da09d435640309d[m
Merge: 50bfad6 cc6a0ac
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Fri Aug 7 16:34:44 2020 +0530

    Merge pull request #267 from postmanlabs/feature/fix-invalid-baseurl-rootserver
    
    Fixed issue where URL did not contain baseUrl as host when base url variables are present.

[33mcommit 2fe2de64c0c3087f742c201637d5f629f041cebc[m
Merge: 0587413 694c40b
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Fri Aug 7 16:33:54 2020 +0530

    Merge pull request #276 from postmanlabs/feature/fixed-double-validation
    
    Fixed an issue where suggested value for mismatch did not fix corresponding mismatch upon applying.

[33mcommit 50bfad66b97e1aee28cc7b7c1c149fdec33ff65f[m
Merge: a6ef20b ef116ec
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Fri Aug 7 16:33:37 2020 +0530

    Merge pull request #275 from postmanlabs/feature/fix-root-path-mismatch
    
    Fixed issue where root path was not matched during validation.

[33mcommit a6ef20b111182a1d9424f64d7596c30b0a220b3c[m
Merge: 1ccbd6c 984186a
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Thu Aug 6 12:42:33 2020 +0530

    Merge pull request #266 from postmanlabs/feature/fix-empty-collectionvar-value
    
    Fixed issue where collection variable generated for path variables had empty values.

[33mcommit 1ccbd6c3af61480c6244861c41ce476ac3cd8291[m
Merge: 80baef2 bff8397
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Thu Aug 6 12:38:40 2020 +0530

    Merge pull request #277 from postmanlabs/feature/fix-typeerror-name
    
    Fixed TypeError happening when null parameter value provided.

[33mcommit 694c40bfbde80f3edebdc2f03897a3856c944185[m[33m ([m[1;31morigin/feature/fixed-double-validation[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Wed Aug 5 12:00:39 2020 +0530

    Fixed test collection to use example instead schema for param resolution

[33mcommit cc7c8857bdecced50dd1af151d94bf70228cdd7f[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Wed Aug 5 11:44:39 2020 +0530

    Fixed an issue where it suggested value did not fix corresponding mismatch

[33mcommit 0587413866b37545b9691bffb1379deed9117454[m
Merge: a09ab65 80baef2
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Wed Aug 5 11:20:27 2020 +0530

    Merge branch 'develop' of github.com:postmanlabs/openapi-to-postman into feature/validation-test

[33mcommit a09ab65b86585a56c1c7024037e708ee0c953710[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Wed Aug 5 11:17:51 2020 +0530

    Added tests for fixed bugs in previous release

[33mcommit ef116ec61319acf153f1bb2ec34ed3a3ebe2d409[m[33m ([m[1;31morigin/feature/fix-root-path-mismatch[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Tue Aug 4 18:25:15 2020 +0530

    Fixed issue where root path was not matched during validation

[33mcommit 5dff346f86f158db1cb090efb9ed45ea5c3a03f9[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Jul 27 13:24:05 2020 +0530

    Fixed an issue where transaction was not matching if path had segment with fix and variable parts

[33mcommit bff83974d42a21bb026fb189a9f1a07c708e5428[m[33m ([m[1;31morigin/feature/fix-typeerror-name[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Jul 24 18:04:04 2020 +0530

    Fixed TypeError: paramValue.indexOf is not a function

[33mcommit 7723a55d4f1cadfeee4065065a69c7bf21db3360[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Jul 20 00:51:59 2020 +0530

    Fixed TypeError happening when schema contains empty/invalid response header

[33mcommit 80baef2164086a606561ad5e79f9db721c572852[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Tue Jul 21 14:46:55 2020 +0530

    Changelog for v1.2.5

[33mcommit cd517fc8ac24705eb7dbc8b1b72a6cd8814b9f63[m[33m ([m[1;33mtag: v1.2.5[m[33m)[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Tue Jul 21 14:45:00 2020 +0530

    1.2.5

[33mcommit cc6a0acc82aaa62b08e29761db4769971cecd2a6[m[33m ([m[1;31morigin/feature/fix-invalid-baseurl-rootserver[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Jul 20 22:50:43 2020 +0530

    Fixed issue where URL did not contain baseUrl as host when base url variables are present

[33mcommit 984186ad6581581603cb61b159408aa7f39bab9c[m[33m ([m[1;31morigin/feature/fix-empty-collectionvar-value[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Jul 20 21:24:49 2020 +0530

    Fixed issue where collection variable generated for path variables contained empty values

[33mcommit 4ee4e36c5bf1d91e803d0e40a0aaf77f3b0346a7[m[33m ([m[1;31morigin/feature/fix-invalid-deserialisation[m[33m)[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Mon Jul 20 16:02:28 2020 +0530

    Fixed issue where invalid deserialisation was happening for param style matrix

[33mcommit d46a34dc620482c3c724a4d46adbfa586e0f4d3f[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Jul 17 11:48:47 2020 +0530

    Added validation tests to improve code coverage

[33mcommit 4eb820014d7d594e267b48a917efd0701288b4c7[m
Merge: 8272870 e4c8bcf
Author: Umesh Pathak <31915995+umeshp7@users.noreply.github.com>
Date:   Fri Jul 17 16:59:58 2020 +0530

    Merge pull request #264 from postmanlabs/feature/fix-validate-function
    
    fix incorrect variable calling

[33mcommit e4c8bcf6a12ca7751ebf5ce0cd5c5ec5d8ee726d[m[33m ([m[1;31morigin/feature/fix-validate-function[m[33m)[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Fri Jul 17 12:15:24 2020 +0530

    fix incorrect variable calling

[33mcommit 25081a1f5271ccc32c296eb2098df54a8d9a0cd0[m
Author: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
Date:   Thu Jul 16 14:36:21 2020 +0000

    Bump lodash from 4.17.13 to 4.17.19
    
    Bumps [lodash](https://github.com/lodash/lodash) from 4.17.13 to 4.17.19.
    - [Release notes](https://github.com/lodash/lodash/releases)
    - [Commits](https://github.com/lodash/lodash/compare/4.17.13...4.17.19)
    
    Signed-off-by: dependabot[bot] <support@github.com>

[33mcommit 82728707d80c1720fe8c296fcb5302dc952e190b[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 12:30:15 2020 +0530

    Changelog for v1.2.4

[33mcommit 20dd3f088ff2d3fed7512a413bf210882272db7c[m[33m ([m[1;33mtag: v1.2.4[m[33m)[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 12:21:56 2020 +0530

    1.2.4

[33mcommit f5da97f758d389d9d3826ad401feac11729d02dd[m
Merge: a854128 6d8d4d3
Author: Umesh Pathak <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 12:08:06 2020 +0530

    Merge pull request #259 from postmanlabs/feature/update-option
    
    Update optimize conversion option copy

[33mcommit 6d8d4d3b9fa7a23f8f0adf89675b3d6cbb2703db[m[33m ([m[1;31morigin/feature/update-option[m[33m)[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 11:58:34 2020 +0530

    Update system test for getOptions

[33mcommit d10df30a05ed2c7901129378256d51bd45cbb1a8[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 11:45:52 2020 +0530

    Update optimize conversio option copy

[33mcommit a854128320c99864fea8deab971e0795a99f27c3[m
Merge: 9081c05 d555e1f
Author: Umesh Pathak <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 01:25:59 2020 +0530

    Merge pull request #244 from postmanlabs/feature/performance-improvements
    
    Performance Improvements [POC]

[33mcommit d555e1f7919f56813d7c23764d4a2b41da92f643[m[33m ([m[1;31morigin/feature/performance-improvements[m[33m)[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Wed Jul 15 01:21:30 2020 +0530

    Add missing variable

[33mcommit fd3ddcbd9fe2c865195fc8f0bf8222fa3cd4c376[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Tue Jul 14 17:32:55 2020 +0530

    Remove fakeData check in convertToPmHeader

[33mcommit 782e213e5d54265b85ed64ab05007c29c5c51800[m
Merge: 32d49cf 9081c05
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Tue Jul 14 15:56:22 2020 +0530

    Merge develop into performance-improvements

[33mcommit 9081c05b05d60387effb486fc1dadaa730b79226[m
Merge: c634215 a946b2e
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Tue Jul 14 15:21:44 2020 +0530

    Merge branch 'release/1.2.3' into develop

[33mcommit a946b2e49ad0051436370bdd54480d95ee1f1539[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Tue Jul 14 14:33:05 2020 +0530

    Released v1.2.3

[33mcommit c634215cf80409029db86c5950448564b45463f2[m
Merge: f22c6d3 6995a19
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Tue Jul 14 14:13:14 2020 +0530

    Merge pull request #254 from postmanlabs/feature/skip-security-header-validation
    
    Skip validation for headers/query-params added by security scheme.

[33mcommit 6995a1922eacffe3b7cbc51e8bce5cf039ab70f8[m[33m ([m[1;31morigin/feature/skip-security-header-validation[m[33m)[m
Merge: e18dba0 f22c6d3
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Tue Jul 14 11:31:03 2020 +0530

    Merge branch 'develop' of github.com:postmanlabs/openapi-to-postman into feature/skip-security-header-validation

[33mcommit f22c6d34bf5bb10acd588eba9e48545bdd317679[m
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Tue Jul 14 11:26:48 2020 +0530

    Added support for parameter serialisation in conversion and deserialisation in validation. (#257)
    
    * Added support for parameter string serialisation for conversion and deserialisation during validation
    
    * Fixed existing test for string serialisation
    
    * Added support for parameter string serialisation for conversion and deserialisation during validation
    
    * Fixed existing test for string serialisation
    
    Co-authored-by: Vishal Shingala <vishalkumar.shingala@postman.com>

[33mcommit e18dba0b4673f529bc4526bd9f56363475da7635[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Tue Jul 14 11:25:29 2020 +0530

    Added OpenAPI suggested headers to implicit headers list to be ignored during validation

[33mcommit 0a2c221d29af2b9b971720b3fea8ef825c77321b[m
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Tue Jul 14 11:23:17 2020 +0530

    Added support for collection variables for local servers in suggested request for validation. (#247)
    
    * Added support for collection variables for local servers in suggested request
    
    * Suggest collection variable from baseUrl and vars if no path level servers are defined
    
    * Keep endpoint prop same across all schema
    
    * Fixed invalid Url and collection variable when path level server was present
    
    * To not include variable generated from empty server object
    
    * Rebased branch to update variable name handling in missing endpoint suggestion
    
    * Updated variable name handling to more readable format
    
    * fixed wrong checking for path level servers
    
    * Fixed issue where path level server was always picked up
    
    * Fixed failing test
    
    Co-authored-by: Vishal Shingala <vishalkumar.shingala@postman.com>
    Co-authored-by: Abhijit Kane <abhijitkane@gmail.com>

[33mcommit 207e3514c5e0d8ddf4cdc9a842673e51e4efc96b[m
Merge: e0a9670 5afac69
Author: Abhijit Kane <abhijitkane@gmail.com>
Date:   Tue Jul 14 11:09:17 2020 +0530

    Merge pull request #248 from postmanlabs/feature/ignore-body-variables
    
    Fixed collection variable ignoring when pattern property is present

[33mcommit e0a9670893099068e6d97811f4c76d1adc11b7e1[m
Merge: f84b2da ba97cfc
Author: Vishal Shingala <vishalkumar.shingala@getpostman.com>
Date:   Tue Jul 14 10:11:08 2020 +0530

    Merge pull request #246 from postmanlabs/feature/fix-typeerror-empty-parameters
    
    Fixed TypeError happening when empty parameter is provided.

[33mcommit 32d49cf31b994c12b712b1561c2df194ce4bbcb3[m
Author: umeshp7 <31915995+umeshp7@users.noreply.github.com>
Date:   Mon Jul 13 16:39:19 2020 +0530

    add missing jsdoc for analyzeSpec and determineOptions

[33mcommit a51ce6a4d7c3abd1effabdff423e0c08629b7a66[m
Author: Vishal Shingala <vishalkumar.shingala@postman.com>
Date:   Fri Jul 10 15:59:17 2020 +0530

    Fixed issue where params added by security schemes where providing mismatches

[33mcommit f84b2daf32744b6b678424d7f337625feebdd2a8[m
Merge: a44474a 4fcad5b
Author: Abhijit Kane <abhijitkane@gmail.com>
Date:   Thu Jul 9 16:41:33 2020 +0530

    Merge pull request #251 from postmanlabs/feature/fix-empty-description-mismatch
    
    Fixed issue where empty description property caused mismatch.

[33mcommit a44474a3ac6ff3661896dc7099606acffe5b85b0[m
Merge: 5ed5ca8 f44192f
Author: Abhijit Kane <abhijitkane@gmail.com>
Date:   Thu Jul 9 16:40:17 2020 +0530

    Merge pull request #249 from postmanlabs/feature/fix-invalid-datapath
    
    Fixed dataPath handling for root property when dataPath is empty string
