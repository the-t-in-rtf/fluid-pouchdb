# Using this Package in Fluid IoC Tests

This package provides components that can be used when writing [Fluid IoC Tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

To load these components, in addition to requiring the package itself, you will also need to load the testing support,
as in the following example:

```javascript
var fluid = require("infusion");
require("fluid-pouchdb");
fluid.pouch.loadTestingSupport();

// Your tests go here...

```

Once you have done this, you have access to the components outlined below.

## `fluid.test.pouch.environment`

This is an extension of `fluid.test.testEnvironment` that is intended for use with a `caseHolder` like
`fluid.tests.express.caseHolder`, or one that follows the same conventions, namely:

1. Before each test, a `constructFixtures` event is fired on the `testEnvironment`, which constructs a
   `fluid.test.pouch.harness` instance.
2. The tests will not run until the `testEnvironment` fires its `onFixturesConstructed` event.  All test fixtures boil
   up their own events that must all complete before `onFixturesConstructed` can fire.

If you are extending the `fluid.tests.express.caseHolder` grade, remember to write your tests under  `options.rawModules`
instead of `options.modules`.  See [the `fluid-express` documentation](https://github.com/the-t-in-rtf/fluid-express/) for
details.

### Component Options

| Option            | Type       | Description |
| ----------------- | ---------- | ----------- |
| `port` (required) | `{Number}` | The port on which the test harness will run (see below). |
| `pouchConfig`     | `{Object}` | Configuration options to pass to our `fluid.pouch` instance (see [the `fluid.pouch` docs](pouch-component.md) for supported options). |
| `harnessGrades`   | `{Array}`  | An array of gradeNames to add to the `fluid.pouch.harness` instance constructed by the test environment. See example below. |

The `harnessGrades` option is intended to help you avoid having to pass in deep configuration to the harness instance
used by the test environment.  Here is an example of how you might use this functionality:

```javascript
fluid.defaults("my.mixin.grade", {
    gradeNames: ["fluid.component"],
    databases: {
        myEmptyDb: {},
        myFullDb:  { data: "%my-package-name/tests/data/file.json" }
    }
});

fluid.defaults("my.tests.environment", {
    gradeNames: ["fluid.test.pouch.environment"],
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
