# gpii-pouchdb

This package is designed to allow you to test integration with CouchDB using PouchDB and libraries that closely follow
the implementation of the CouchDB REST API.

This package provides the `gpii.pouch` component, which is a `gpii.express.router` that is meant to be wired into the
root of a `gpii.express` instance, as in this example (this is written as a component definition, because you will
generally be using this as part of a `fluid.testEnvironment`:

    ```
    components: {
        pouchExpress: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        "port" : "9989",
                        baseUrl: "http://localhost:9989/"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "http://localhost:9989/"
                    }
                }
                components: {
                    pouchDb: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                sample:  { data: [ sampleData, supplementalData] },
                                _users:  { data: userData},
                            }
                        }
                    }
                }
            }
        }
    }
    ```
The `gpii.pouch` component supports all the options of `gpii.express.router` (and you must provide a `path`
option).  The component also allows you to specify the full list of databases and to indicate what sample data you wish to load
(if any).  A database whose name matches the supplied key will be created.  You can optionally populate the database
with data by supplying either a string or an array of string that point to the location of JSON files containing data.

Data files are expected to follow the format used by the CouchDB and PouchDB bulk document API.  The simplest example
looks something like:

    ```
    {
      "docs": [ { "_id": "myId", "foo": "bar"} ]
    }
    ```

As with CouchDB's bulk document API, the `_id` variable is optional, but if supplied, must be unique.

When all data is loaded and pouch itself is available, the `gpii.pouch` component emits an `onStarted` event.  Your
test environment will typically listen to this event and emit its own event when all components are ready.

For examples of how this package can be used in Fluid IoC tests, check out the tests in this package, particularly
`tests/js/harness.js` and `tests/js/basic-tests.js`.