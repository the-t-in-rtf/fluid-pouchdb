# Using this Package in Fluid IoC Tests

This package provides components that can be used when writing [Fluid IoC Tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

To load these components, in addition to requiring the package itself, you will also need to load the testing support,
as in the following example:

```
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
require("gpii-pouchdb");
gpii.pouch.loadTestingSupport();

// Your tests go here...

```

Once you have done this, you have access to the components outlined below.

# `gpii.test.pouch.environment`

This is an extension of `fluid.test.testEnvironment` that is intended for use with a `caseHolder` like
`gpii.tests.express.caseHolder`, or one that follows the same conventions, namely:

1. Before each test, a `constructFixtures` event is fired on the `testEnvironment`, which constructs a `gpii.test.pouch.harness` instance.
2. The tests will not run until the `testEnvironment` fires its `onFixturesConstructed` event.  All test fixtures boil up their own events that must all complete before `onFixturesConstructed` can fire.

If you are extending the `gpii.tests.express.caseHolder` grade, remember to write your tests under  `options.rawModules`
instead of `options.modules`.  See [the `gpii-express` documentation](https://github.com/the-t-in-rtf/gpii-express/) for details.

## Component Options

| Option            | Type       | Description |
| ----------------- | ---------- | ----------- |
| `port` (required) | `{Number}` | The port on which the test harness will run (see below). |
| `pouchConfig`     | `{Object}` | Configuration options to pass to our `gpii.pouch` instance (see [the `gpii.pouch` docs](pouch-component.md) for supported options). |
| `harnessGrades`   | `{Array}`  | An array of gradeNames to add to the `gpii.test.pouch.harness` instance constructed by the test environment. See example below. |

The `harnessGrades` option is intended to help you avoid having to pass in deep configuration to the harness instance
used by the test environment.  Here is an example of how you might use this functionality:

```
fluid.defaults("my.mixin.grade", {
    gradeNames: ["fluid.component"],
    databases: {
        myEmptyDb: {},
        myFullDb:  { data: "%my-package-name/tests/data/file.json" }
    }
});

fluid.defaults("my.tests.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    port: 6789,
    harnessGrades: ["my.mixin.grade"],
    components: {
        caseHolder: {
            type: "my.tests.caseHolder"
        }
    }
});

fluid.tests.runTests("my.tests.environment");
```

# `gpii.test.pouch.harness`

An instance of `gpii.express` which has an instance of `gpii.pouch` wired into it.  Provides a working HTTP REST API
equivalent to CouchDB.  Although you will generally use this in combination with the test enviroment above, it can
also be used on its own. As an example, the file `tests/js/launch-test-test-harness.js` included with this package can be
used to launch a standalone test instance of this package for manual QA.

## Component Options

| Option            | Type       | Description |
| ----------------- | ---------- | ----------- |
| `port` (required) | `{Number}` | The port on which the test harness will run. |