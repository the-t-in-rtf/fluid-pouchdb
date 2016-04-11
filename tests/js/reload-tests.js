// Confirming that pouch can safely be loaded and reloaded without resulting in duplicate data.
//
// This test only works at the moment because we have enacted a workaround and added an `_id` variable for all records.
//
// See https://issues.gpii.net/browse/GPII-1239 for details.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./includes");

fluid.defaults("gpii.pouch.tests.reload.caseHolder", {
    gradeNames: ["gpii.tests.express.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing initial pouch load...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstRequest}.send"
                        },
                        {
                            listener: "gpii.pouch.tests.reload.checkResponse",
                            event:    "{firstRequest}.events.onComplete",
                            args:     ["{firstRequest}.nativeResponse", "{arguments}.0"]
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
                            listener: "gpii.pouch.tests.reload.checkResponse",
                            event:    "{secondRequest}.events.onComplete",
                            args:     ["{firstRequest}.nativeResponse", "{arguments}.0"]
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

fluid.defaults("gpii.pouch.tests.reload.environment", {
    gradeNames: ["gpii.pouch.tests.environment"],
    port:       6792,
    baseUrl:    "http://localhost:6792/",
    testUrl:    "/sample/",
    components: {
        testCaseHolder: {
            type: "gpii.pouch.tests.reload.caseHolder"
        }
    }
});

gpii.pouch.tests.reload.environment();
