/* eslint-env node */
/* Tests for the "pouch" module */
"use strict";
var fluid = require("infusion");

fluid.require("%fluid-pouchdb");
fluid.pouch.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("fluid-express");
fluid.express.loadTestingSupport();

require("../pouch-config");

fluid.defaults("fluid.tests.pouch.basic.caseHolder", {
    gradeNames: ["fluid.test.pouch.caseHolder"],
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
            name: "Testing fluid-pouchdb (filesystem)...",
            tests: [
                {
                    name: "Testing loading pouch root...",
                    type: "test",
                    sequence: [
                        {
                            func: "{rootRequest}.send"
                        },
                        {
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
                            event:    "{preDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preDeleteRequest}.nativeResponse", "{arguments}.0", 200]
                        },
                        // The delete should be successful.
                        {
                            func: "{deleteRequest}.send"
                        },
                        {
                            listener: "fluid.test.pouch.checkResponse",
                            event:    "{deleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{deleteRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.delete"]
                        },
                        // The record should no longer exist after we delete it.
                        {
                            func: "{verifyDeleteRequest}.send"
                        },
                        {
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
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
                            listener: "fluid.test.pouch.checkResponse",
                            event:    "{insertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{insertRequest}.nativeResponse", "{arguments}.0", 201]
                        },
                        // The record should exist after we create it.
                        {
                            func: "{verifyInsertRequest}.send"
                        },
                        {
                            listener: "fluid.test.pouch.checkResponse",
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
            type: "fluid.test.pouch.request",
            options: {
                path: "/"
            }
        },
        massiveRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/massive/_all_docs"
            }
        },
        noDataRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/nodata/_all_docs"
            }
        },
        readRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/sample/foo"
            }
        },
        supplementalReadRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/sample/supplemental"
            }
        },
        preDeleteRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/sample/todelete"
            }
        },
        deleteRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path:   "/sample/todelete",
                method: "DELETE"
            }
        },
        verifyDeleteRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path: "/sample/todelete"
            }
        },
        preInsertRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path:   "/sample/toinsert"
            }
        },
        insertRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path:   "/sample/toinsert",
                method: "PUT"
            }
        },
        verifyInsertRequest: {
            type: "fluid.test.pouch.request",
            options: {
                path:   "/sample/toinsert"
            }
        }

    }
});

fluid.defaults("fluid.tests.pouch.basic.environment", {
    gradeNames: ["fluid.test.pouch.environment"],
    port:       6798,
    pouchConfig: {
        databases:  fluid.tests.pouch.config.databases
    },
    components: {
        testCaseHolder: {
            type: "fluid.tests.pouch.basic.caseHolder"
        }
    }
});

fluid.test.runTests("fluid.tests.pouch.basic.environment");
