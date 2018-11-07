# `gpii.pouch.harness`

A component which spins up a CouchDB docker container and populates it with data.  Although you will generally use this
in combination with the test environment provided by this package, it can also be used on its own. As an example, the
file `tests/js/launch-test-test-harness.js` included with this package can be used to launch a standalone test instance
of this package for manual QA.

Although a full instance of CouchDB has advantages, the creation of a Docker container is more expensive than the
previous approach relying on express-pouchdb.  To save on buildup and teardown time, this component will only create a
container if one does not already exists.

If no container exists, one will be created, and all databases will be created and have their data loaded.  If a
container already exists, it will be associated with this component.  Depending on whether `cleanOnStartup` is set, the
existing container may have its data removed and the data in `options.databases` loaded.

This component monitors the health of the Docker container, and will automatically destroy itself if its associated
container is stopped or removed.  The health check also serves to ensure that the component is kept alive, otherwise
node will immediately destroy the component once startup completes.

## Component Options

| Option                             | Type              | Description |
| ---------------------------------- | ----------------- | ----------- |
| `cleanOnStartup`                   | `{Boolean}`       | Whether to remove CouchDB data on startup. Defaults to `true`. |
| `commandTemplates`                 | `{Object}`        | Templates that are used with `fluid.stringTemplate` and various data to construct Docker commands (see below). |
| `commandTemplates.getCouchPort`    | `{String`}        | The command to use to detect the port Docker has exposed to communicate with CouchDB. |
| `commandTemplates.healthCheck`     | `{String`}        | The command to use to verify that our associated container is still running. |
| `commandTemplates.listContainers`  | `{String`}        | The command to use to find containers with the label `options.containerLabel`. |
| `commandTemplates.removeContainer` | `{String`}        | The command to use to remove a container. |
| `commandTemplates.startContainer`  | `{String`}        | The command to use to start a container. |
| `containerLabel`                   | `{String}`        | The label to use to identify our Docker container.  Defaults to `gpii-pouchdb-test-harness`. |
| `containerMonitoringInterval`      | `{Integer}`       | This component will shut itself down if its associated Docker container dies or is stopped.  This setting controls how often (in milliseconds) to check to see if the container is up.  Defaults to `1000`, or one second. |
| `couchDbsToPreserve`               | `{Array<String>}` | An array of database names that should not be cleared out when `options.cleanOnStartup` is `true`. |
| `couchSetupCheckInterval`          | `{Integer}`       | If we have to create a new container, we have to wait until Couch is responding to requests.  This setting controls how often (in milliseconds) to check to see if CouchDB is up. Defaults to `250`. |
| `couchSetupTimeout`                | `{Integer}`       | How long (in milliseconds) to wait for the above health checks to complete before triggering a failure. Defaults to `5000`, or 5 seconds. |
| `databases`                        | `{Array}`         | A map of databases and data files to provision them with.  See below. |

### The `databases` Option

If the container does not exist or `cleanOnStartup` is set to true, the Docker container associated with this component
will be provisioned with databases and content based on the contents of `options.databases`, as shown in this example:

```javascript
var fluid = require("infusion");
var my = fluid.registerNamespace("my");

require("my-package");
require("my-other-package");

fluid.defaults("my.harness", {
    gradeNames: ["gpii.pouch.harness"],
    databases: {
        singleFile: {
            data: "%my-package/tests/data/onePayload.json"
        },
        lotsOfFiles: {
            data: [
                "%my-package/tests/data/onePayload.json",
                "%my-other-package/tests/data/otherPayload.json"
            ]
        },
        empty: {}
    }
});
```

Each file is expected to be a valid payload that can be used with the [CouchDB bulk document
API](http://docs.couchdb.org/en/2.2.0/api/database/bulk-api.html#db-bulk-docs), something like:

```json
{
    "docs": [
        {
            "_id": "id1",
            "key": "value"
        },
        {
            "_id": "id2",
            "other-key": "other value"
        }
    ]
}
```

Even though the harness no longer uses express-pouchdb, you can also use the legacy `options.pouchConfig.databases`
option, although it's recommended that you updated your code, as this option may not be supported in a future release.

## Component Invokers

### `{that}.cleanup()`

This invoker allows you to trigger a manual reset of all data.  You can also fire the `onCleanup` event to call this
invoker.

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedCleanup`.  By default:

1. All databases that are not listed in `options.couchDbsToPreserve` will be removed.
2. Any databases listed in `options.databases` will be created and any associated data will be loaded.
3. When the reset is complete, the `onCleanupComplete` event is fired.  

You can add your own cleanup steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

### `{that}.shutdown()`

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedShutdown`.  By default:

1. Our internal health checking of the associated container is disabled.
2. The `onShutdownComplete` event is fired.

You can add your own shutdown steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

### `{that}.startup()`

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedStartup`.  By default:

1. The container is created and populated if necessary (see above for options).
2. The health checking of the associated Docker container is started.
3. The `onStartupComplete` event is fired.

You can add your own shutdown steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

## `gpii.pouch.harness.persistent`

This is a convenience grade that matches the previous grade structure of this package. It is identical to
`gpii.pouch.harness` but has `options.cleanOnStartup` set to `false`.  If you use this grade and need to reset the data,
you must manually call `{that}.cleanup()` (see above).

## Promise Chaining Events

The `combinedCleanup`, `combinedStartup`, and `combinedShutdown` events are ["promise chaining
events"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options).
These chains consist of a prioritised list of listeners.  In this package, each of these listeners calls a function
that either returns a promise, or a promise-returning function.  Each step in the chain is only executed when the
preceding link either returns a literal value, or when the promise associated with the previous step in the chain is
resolved.  If any link in the chain is rejected, the chain does not continue execution further.

To give a practical example, let's assume that we are working with a CouchDB view that must be indexed the first time
it is retrieved, and that we want to ourselves retrieve the view to ensure that no end user has to wait for the
indexing to occur.  We might use code like the following to accomplish this:

```javascript
/*

        You can find all steps in the chain in ./src/js/harness.js, for our purposes we want to execute after this step:

        "combinedStartup.startIfNeeded": {
            priority: "first",
            funcName: "gpii.pouch.harness.startIfNeeded",
            args:     ["{that}"]
        },

 */
var fluid = require("infusion");
var my    = fluid.registerNamespace("my");

fluid.require("%my-package");

var request = require("request");

fluid.registerNamespace("my.custom.harness");

my.custom.harness.indexView = function (that) {
    var indexingPromise = fluid.promise();
    try {
        var viewUrl = fluid.stringTemplate(that.options.viewUrlTemplate, { port: that.couchPort });
        request.get(viewUrl, function (requestError, response, body) {
            if (requestError) {
                indexingPromise.resolve(requestError);
            }
            else if (response.status !== 200) {
                indexingPromise.resolve(body);
            }
            else {
                indexingPromise.resolve(body);
            }
        });
    }
    // Low level error such as missing `viewUrlTemplate` option.
    catch (error) {
        indexingPromise.resolve(error);
    }
    return indexingPromise;
};

fluid.defaults("my.custom.harness", {
    gradeNames: ["gpii.pouch.harness"],
    viewUrlTemplate: "http://localhost:%port/mydb/_design/docName/_view/viewName",
    databases: {
        mydb: {
            data: "%my-package/tests/data/views.json"
        }
    },
    listeners: {
        "combinedStartup.indexView": {
            priority: "after:startIfNeeded",
            funcName: "my.custom.harness.indexView",
            args: ["{that}"]
        },
        "combinedStartup.logIndexResults": {
            priority: "after:indexView",
            funcName: "fluid.log",
            args:     ["Index results:", "{arguments}.0"]
        }
    }
});

my.custom.harness();
```

Our custom harness will now try to access our view once the Docker container is available.  In this case we don't wish
to block startup, so whether there is an error or a successful view retrieval, the associated promise will be resolved.
The next step we've added in the chain will simply log the results.  Because `fluid.log` immediately returns, execution
will immediately continue to the next link in the startup chain.  This illustrates how you can mix asynchronous and
synchronous functions in a "chained promise event".
