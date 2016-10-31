/*

    Confirm that we can consistently choose to persist or reset data between runs.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

fluid.logObjectRenderChars = 102400;

require("../../../");
gpii.pouch.loadTestingSupport();

fluid.defaults("gpii.tests.pouch.persistent.request", {
    gradeNames: ["gpii.test.pouch.request"],
    path:   "/sample/new",
    method: "GET"
});


fluid.defaults("gpii.tests.pouch.persistent.caseHolder", {
    gradeNames: ["gpii.test.pouch.caseHolder.base"],
    sampleRecord: { _id: "new", foo: "bar"},
    rawModules: [{
        name: "Testing persistence within a single restart...",
        tests: [
            {
                name: "Set a record and confirm that it's there...",
                type: "test",
                sequence: [
                    {
                        func: "{insertRequest}.send",
                        args: ["{that}.options.sampleRecord"]
                    },
                    {
                        event:    "{insertRequest}.events.onComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["The status code should be as expected...", 201, "{insertRequest}.nativeResponse.statusCode"]
                    },
                    {
                        func: "{getAfterInsertRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getAfterInsertRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The record should be readable", "{that}.options.sampleRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            },
            {
                name: "Confirm that the record is still there after a restart...",
                type: "test",
                sequence: [
                    {
                        func: "{getAfterRecreateRequest}.send",
                        args:     []
                    },
                    {
                        event:    "{getAfterRecreateRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The record should still be found.", "{that}.options.sampleRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            },
            {
                name: "Confirm that the record is no longer there after cleaning up the data and recreating express-pouchdb...",
                type: "test",
                sequence: [
                    {
                        task:        "{harness}.cleanup",
                        resolve:     "{getAfterResetRequest}.send",
                        resolveArgs: []
                    },
                    {
                        event:    "{getAfterResetRequest}.events.onComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["There should no longer be a record.", 404, "{getAfterResetRequest}.nativeResponse.statusCode"]
                    }
                ]

            }
        ]
    }],
    components: {
        insertRequest: {
            type: "gpii.tests.pouch.persistent.request",
            options: {
                method: "PUT"
            }
        },
        getAfterInsertRequest: {
            type: "gpii.tests.pouch.persistent.request"
        },
        getAfterRecreateRequest: {
            type: "gpii.tests.pouch.persistent.request"
        },
        getAfterResetRequest: {
            type: "gpii.tests.pouch.persistent.request"
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    components: {
        harness: {
            type: "gpii.pouch.harness.persistent"
        },
        caseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder"
        }
    },
    port:       6798,
    pouchConfig: {
        databases: { sample:  {} }
    }
});

fluid.test.runTests("gpii.tests.pouch.persistent.environment");
