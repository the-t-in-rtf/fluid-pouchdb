/* eslint-env node */
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

require("../pouch-config");
require("../lib/");

fluid.registerNamespace("gpii.tests.pouch.basic");

gpii.tests.pouch.basic.checkRecordAndStartDelete = function (response, body, expectedStatus, expectedBody, deleteRequest, deletePort) {
    var record = JSON.parse(body);
    gpii.test.pouch.checkResponse(response, body, expectedStatus, expectedBody);

    // DELETE requests must reference a specific revision, as in:
    // DELETE /recipes/FishStew?rev=1-9c65296036141e575d32ba9c034dd3ee
    deleteRequest.send({}, { port: deletePort, termMap: { rev: record._rev } });
};

fluid.defaults("gpii.tests.pouch.basic.caseHolder", {
    gradeNames: ["gpii.test.pouchdb.caseHolder"],
    expected: {
        root:             { couchdb:"Welcome","vendor":{ "name":"The Apache Software Foundation" } },
        massive:          { total_rows: 150 },
        noData:           { total_rows: 0 },
        read:             { foo: "bar" },
        supplementalRead: { has: "data" },
        afterDelete:      {},
        beforeDelete:     { _id: "todelete"},
        insert:           { id: "toinsert", foo: "bar"}
    },
    rawModules: [
        {
            name: "Testing docker test harness...",
            tests: [
                {
                    name: "Testing loading CouchDB root...",
                    type: "test",
                    sequence: [
                        {
                            func: "{rootRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{massiveRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{noDataRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{readRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{supplementalReadRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{preDeleteRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
                        },
                        // confirm that the record exists now and delete the latest revision.
                        {
                            listener: "gpii.tests.pouch.basic.checkRecordAndStartDelete",
                            event:    "{preDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preDeleteRequest}.nativeResponse", "{arguments}.0", 200, "{that}.options.expected.beforeDelete", "{deleteRequest}", "{harness}.couchPort"]
                        },
                        // The delete request should be successful.
                        {
                            listener: "gpii.test.pouch.checkResponse",
                            event:    "{deleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{deleteRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.afterDelete"]
                        },
                        // The record should no longer exist after we delete it.
                        {
                            func: "{verifyDeleteRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            func: "{preInsertRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                            args: ["{that}.options.expected.insert", "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
                        },
                        {
                            listener: "gpii.test.pouch.checkResponse",
                            event:    "{insertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{insertRequest}.nativeResponse", "{arguments}.0", 201]
                        },
                        // The record should exist after we create it.
                        {
                            func: "{verifyInsertRequest}.send",
                            args: [{}, "@expand:gpii.test.pouch.wrapPort({harness}.couchPort)"]
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
                path:   "/sample/todelete?rev=%rev",
                method: "DELETE",
                termMap: { "rev": "%rev"}
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

fluid.defaults("gpii.tests.pouch.basic.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    pouchConfig: {
        databases:  gpii.tests.pouch.config.databases
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.basic.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.pouch.basic.environment");
