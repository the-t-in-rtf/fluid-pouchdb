// Confirming that pouch can safely be loaded and reloaded without resulting in duplicate data.
//
// This test only works at the moment because we have enacted a workaround and added an `_id` variable for all records.
//
// See https://issues.gpii.net/browse/GPII-1239 for details.
//
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

fluid.defaults("gpii.tests.pouch.reload.caseHolder", {
    gradeNames: ["gpii.test.pouch.caseHolder"],
    rawModules: [
        {
            name: "Testing multiple launches of pouch in a row...",
            tests: [
                {
                    name: "Testing initial pouch load...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkRecordCount",
                            event:    "{firstRequest}.events.onComplete",
                            args:     ["{firstRequest}.nativeResponse", "{arguments}.0", 4] // response, body, expectedRecords
                        }
                    ]
                },
                {
                    name: "Testing second pouch load...",
                    type: "test",
                    sequence: [
                        {
                            func: "{secondRequest}.send"
                        },
                        {
                            listener: "gpii.test.pouch.checkRecordCount",
                            event:    "{secondRequest}.events.onComplete",
                            args:     ["{firstRequest}.nativeResponse", "{arguments}.0", 4] // response, body, expectedRecords
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        firstRequest: {
            type: "kettle.test.request.http",
            options: {
                path: "{testEnvironment}.options.testUrl",
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        secondRequest: {
            type: "kettle.test.request.http",
            options: {
                path: "{testEnvironment}.options.testUrl",
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        }
    }
});

fluid.defaults("gpii.tests.pouch.reload.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    pouchConfig: {
        databases:  gpii.tests.pouch.config.databases
    },
    port:       6792,
    testUrl:    "/sample/",
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.reload.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.pouch.reload.environment");
