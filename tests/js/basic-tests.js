/* Tests for the "pouch" module */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-pouchdb");
gpii.pouch.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("./pouch-config");

// Convenience grade to avoid putting the same settings into all of our request components


fluid.defaults("gpii.tests.pouch.basic.caseHolder", {
    gradeNames: ["gpii.test.pouch.caseHolder"],
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
            name: "Testing gpii-pouchdb (filesystem)...",
            tests: [
                {
                    name: "Testing loading pouch root...",
                    type: "test",
                    sequence: [
                        {
                            func: "{rootRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
                            event:    "{preDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preDeleteRequest}.nativeResponse", "{arguments}.0", 200]
                        },
                        // The delete should be successful.
                        {
                            func: "{deleteRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkResponse",
                            event:    "{deleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{deleteRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.delete"]
                        },
                        // The record should no longer exist after we delete it.
                        {
                            func: "{verifyDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
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
                            listener: "gpii.test.pouch.checkResponse",
                            event:    "{insertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{insertRequest}.nativeResponse", "{arguments}.0", 201]
                        },
                        // The record should exist after we create it.
                        {
                            func: "{verifyInsertRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkResponse",
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
            type: "gpii.test.pouch.request",
            options: {
                path: "/"
            }
        },
        massiveRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/massive/_all_docs"
            }
        },
        noDataRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/nodata/_all_docs"
            }
        },
        readRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/sample/foo"
            }
        },
        supplementalReadRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/sample/supplemental"
            }
        },
        preDeleteRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/sample/todelete"
            }
        },
        deleteRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/todelete",
                method: "DELETE"
            }
        },
        verifyDeleteRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path: "/sample/todelete"
            }
        },
        preInsertRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/toinsert"
            }
        },
        insertRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/toinsert",
                method: "PUT"
            }
        },
        verifyInsertRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/toinsert"
            }
        }

    }
});

fluid.defaults("gpii.tests.pouch.basic.caseHolder.inMemory", {
    gradeNames: ["gpii.tests.pouch.basic.caseHolder"],
    distributeOptions: {
        record: "Testing gpii-pouchdb (in memory)...",
        target: "{that}.options.rawModules.0.name"
    }
});

fluid.defaults("gpii.tests.pouch.basic.environment.base", {
    port: 6798,
    pouchConfig: {
        databases: gpii.tests.pouch.config.databases
    }
});

fluid.defaults("gpii.tests.pouch.basic.environment", {
    gradeNames: ["gpii.test.pouch.environment", "gpii.tests.pouch.basic.environment.base"],
    port:       6798,
    pouchConfig: {
        databases:  gpii.tests.pouch.config.databases
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.basic.caseHolder"
        }
    }
});

fluid.defaults("gpii.tests.pouch.basic.environment.inMemory", {
    gradeNames: ["gpii.test.pouch.environment.inMemory", "gpii.tests.pouch.basic.environment.base"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.basic.caseHolder.inMemory"
        }
    }
});


// fluid.test.runTests("gpii.tests.pouch.basic.environment");
fluid.test.runTests("gpii.tests.pouch.basic.environment");
// fluid.test.runTests("gpii.tests.pouch.basic.environment.inMemory");
fluid.test.runTests("gpii.tests.pouch.basic.environment.inMemory");
