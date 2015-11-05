// Confirming that pouch can safely be loaded and reloaded without resulting in duplicate data.
//
// This test only works at the moment because we have enacted a workaround and added an `_id` variable for all records.
//
// See https://issues.gpii.net/browse/GPII-1239 for details.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

var jqUnit = require("jqUnit");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../node_modules/kettle");
require("../../node_modules/kettle/lib/test/KettleTestUtils");

require("./harness");
require("../lib/sequence");

fluid.registerNamespace("gpii.pouch.tests.reload");
gpii.pouch.tests.reload.checkResponse = function (response, body) {
    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("There should be four records...", 4, jsonData.doc_count);
};

fluid.defaults("gpii.pouch.tests.reload.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
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
    gradeNames: ["fluid.test.testEnvironment", "autoInit"],
    port:       6792,
    baseUrl:    "http://localhost:6792/",
    testUrl:    "/sample/",
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
            type: "gpii.pouch.tests.reload.caseHolder"
        }
    }
});

gpii.pouch.tests.reload.environment();