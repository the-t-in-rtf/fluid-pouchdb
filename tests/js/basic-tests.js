/* Tests for the "pouch" module */
"use strict";
var fluid      = require("infusion");
var gpii       = fluid.registerNamespace("gpii");

require("./includes");

// Convenience grade to avoid putting the same settings into all of our request components
fluid.defaults("gpii.pouch.tests.basic.request", {
    gradeNames: ["kettle.test.request.http"],
    port:       "{testEnvironment}.options.port",
    method:     "GET"
});

fluid.defaults("gpii.pouch.tests.basic.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    expected: {
        root:             { "express-pouchdb": "Welcome!" },
        massive:          { total_rows: 150 },
        noData:           { total_rows: 0 },
        read:             { foo: "bar" },
        supplementalRead: { has: "data" },
        "delete":         {},
        insert:           { id: "toinsert", foo: "bar"}
    },
    rawModules: [
        {
            tests: [
                {
                    name: "Testing loading pouch root...",
                    type: "test",
                    sequence: [
                        {
                            func: "{rootRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{rootRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{rootRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.root"]
                        }
                    ]
                },
                {
                    name: "Testing 'massive' database...",
                    type: "test",
                    sequence: [
                        {
                            func: "{massiveRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{massiveRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{massiveRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.massive"]
                        }
                    ]
                },
                {
                    name: "Testing 'nodata' database...",
                    type: "test",
                    sequence: [
                        {
                            func: "{noDataRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{noDataRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{noDataRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.noData"]
                        }
                    ]
                },
                {
                    name: "Testing reading a single record from the 'sample' database...",
                    type: "test",
                    sequence: [
                        {
                            func: "{readRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{readRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{readRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.read"]
                        }
                    ]
                },
                {
                    name: "Confirm that supplemental data was loaded for the 'sample' database...",
                    type: "test",
                    sequence: [
                        {
                            func: "{supplementalReadRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{supplementalReadRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{supplementalReadRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.supplementalRead"]
                        }
                    ]
                },
                {
                    name: "Testing deleting a single record from the 'sample' database...",
                    type: "test",
                    sequence: [
                        // The record should exist before we delete it.
                        {
                            func: "{preDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{preDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preDeleteRequest}.nativeResponse", "{arguments}.0", 200]
                        },
                        // The delete should be successful.
                        {
                            func: "{deleteRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{deleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{deleteRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.delete"]
                        },
                        // The record should no longer exist after we delete it.
                        {
                            func: "{verifyDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{verifyDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{verifyDeleteRequest}.nativeResponse", "{arguments}.0", 404]
                        }
                    ]
                },
                {
                    name: "Testing inserting a record into the 'sample' database...",
                    type: "test",
                    sequence: [
                        // The record should not exist before we create it.
                        {
                            func: "{preInsertRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{preInsertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preInsertRequest}.nativeResponse", "{arguments}.0", 404]
                        },
                        // The insert should be successful.
                        {
                            func: "{insertRequest}.send",
                            args: "{that}.options.expected.insert"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{insertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{insertRequest}.nativeResponse", "{arguments}.0", 201]
                        },
                        // The record should exist after we create it.
                        {
                            func: "{verifyInsertRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.basic.checkResponse",
                            event:    "{verifyInsertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{verifyInsertRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.insert"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        rootRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/"
            }
        },
        massiveRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/massive/_all_docs"
            }
        },
        noDataRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/nodata/_all_docs"
            }
        },
        readRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/sample/foo"
            }
        },
        supplementalReadRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/sample/supplemental"
            }
        },
        preDeleteRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/sample/todelete"
            }
        },
        deleteRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path:   "/sample/todelete",
                method: "DELETE"
            }
        },
        verifyDeleteRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path: "/sample/todelete"
            }
        },
        preInsertRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path:   "/sample/toinsert"
            }
        },
        insertRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path:   "/sample/toinsert",
                method: "PUT"
            }
        },
        verifyInsertRequest: {
            type: "gpii.pouch.tests.basic.request",
            options: {
                path:   "/sample/toinsert"
            }
        }

    }
});

fluid.defaults("gpii.pouch.tests.basic.environment", {
    gradeNames: ["gpii.pouch.tests.environment"],
    port:       6798,
    baseUrl:    "/",
    components: {
        testCaseHolder: {
            type: "gpii.pouch.tests.basic.caseHolder"
        }
    }
});

gpii.pouch.tests.basic.environment();