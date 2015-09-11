/* Tests for the "pouch" module */
"use strict";
var fluid      = fluid || require("infusion");
fluid.setLogging(true);

var gpii       = fluid.registerNamespace("gpii");
var jqUnit     = fluid.require("jqUnit");

require("../../node_modules/gpii-express/tests/js/lib/test-helpers");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../node_modules/kettle");
require("../../node_modules/kettle/lib/test/KettleTestUtils");

require("./harness");
require("../lib/sequence");

// Convenience grade to avoid putting the same settings into all of our request components
fluid.defaults("gpii.pouch.tests.basic.request", {
    gradeNames: ["kettle.test.request.http", "autoInit"],
    port:       "{testEnvironment}.options.port",
    method:     "GET"
});

fluid.registerNamespace("gpii.pouch.tests.basic");
gpii.pouch.tests.basic.checkResponse = function (response, body, expectedStatus, expectedBody) {
    expectedStatus = expectedStatus ? expectedStatus : 200;

    var bodyData = JSON.parse(body);

    gpii.express.tests.helpers.isSaneResponse(jqUnit, response, body, expectedStatus);

    // NOTE:  This only works for results where you know the exact response or a simple subset.  Deeply inserted
    // "couchisms" such as record `_id` and `_rev` values must be checked separately.  See the tests in gpii-pouchdb-lucene for an example.
    if (expectedBody) {
        jqUnit.assertLeftHand("The body should be as expected...", expectedBody, bodyData);
    }
};

//    jqUnit.asyncTest("Testing insertion of a new record...", function () {
//        var options = {
//            url:  that.options.baseUrl + "sample",
//            json: { "foo": "bar" }
//        };
//        request.post(options, function (error, response, body) {
//            jqUnit.start();
//            gpii.express.tests.helpers.isSaneResponse(jqUnit, response, body, 201);
//            gpii.tests.pouchdb.isSaneRecordBody(body);
//        });
//    });

fluid.defaults("gpii.pouch.tests.basic.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    expected: {
        root:         { "express-pouchdb": "Welcome!" },
        massive:      { total_rows: 150 },
        noData:       { total_rows: 0 },
        read:         { foo: "bar" },
        "delete":     {},
        insert:       { id: "toinsert", foo: "bar"}
    },
    mergePolicy: {
        rawModules:    "noexpand",
        sequenceStart: "noexpand"
    },
    moduleSource: {
        funcName: "gpii.pouch.tests.addRequiredSequences",
        args:     ["{that}.options.sequenceStart", "{that}.options.rawModules"]
    },
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructServer.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onReady"
        }
    ],
    // Our raw test cases, that will have `sequenceStart` prepended before they are run.
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
    gradeNames: ["fluid.test.testEnvironment", "autoInit"],
    port:       6798,
    baseUrl:    "/",
    events: {
        constructServer: null,
        onReady: null
    },
    components: {
        harness: {
            type: "gpii.pouch.tests.harness",
            createOnEvent: "constructServer",
            options: {
                port:       "{testEnvironment}.options.port",
                baseUrl:    "{testEnvironment}.options.baseUrl",
                listeners: {
                    onReady: "{testEnvironment}.events.onReady.fire"
                }
            }
        },
        testCaseHolder: {
            type: "gpii.pouch.tests.basic.caseHolder"
        }
    }
});

gpii.pouch.tests.basic.environment();