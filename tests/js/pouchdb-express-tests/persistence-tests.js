/*

    Confirm that we can consistently choose to persist or reset data between runs.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

require("../../../");
gpii.pouch.loadTestingSupport();

fluid.defaults("gpii.tests.pouch.persistent.request", {
    gradeNames: ["gpii.test.pouch.request"],
    path:   "/persistence/new",
    method: "GET"
});

fluid.defaults("gpii.tests.pouch.persistent.request.view", {
    gradeNames: ["gpii.tests.pouch.persistent.request"],
    path: "/persistence/_design/persistence/_view/byId?startKey=%22new%22"
});


fluid.defaults("gpii.tests.pouch.persistent.caseHolder", {
    gradeNames: ["gpii.test.pouch.caseHolder.base"],
    persistenceRecord: { _id: "new", foo: "bar"},
    rawModules: [{
        name: "Testing persistence within a single restart...",
        tests: [
            {
                name: "Confirm that we have no indexed records in the view on startup...",
                type: "test",
                sequence: [
                    {
                        func: "{getViewBeforeInsertRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getViewBeforeInsertRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The status code should be as expected...", { total_rows: 0 }, "@expand:JSON.parse({arguments}.0)"]
                    },
                    {
                        func: "jqUnit.assertEquals",
                        args:     ["The status code should be as expected...", 200, "{getViewBeforeInsertRequest}.nativeResponse.statusCode"]
                    }
                ]
            },
            {
                name: "Set a record and confirm that it's there...",
                type: "test",
                sequence: [
                    {
                        func: "{insertRequest}.send",
                        args: ["{that}.options.persistenceRecord"]
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
                        args:     ["The record should be readable", "{that}.options.persistenceRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            },
            {
                name: "Confirm that we have indexed records after adding one...",
                type: "test",
                sequence: [
                    {
                        func: "{getViewAfterInsertRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getViewAfterInsertRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The status code should be as expected...", { total_rows: 1 }, "@expand:JSON.parse({arguments}.0)"]
                    },
                    {
                        func: "jqUnit.assertEquals",
                        args:     ["The status code should be as expected...", 200, "{getViewAfterInsertRequest}.nativeResponse.statusCode"]
                    }
                ]
            },
            {
                name: "Confirm that the record is still there after a restart...",
                type: "test",
                sequence: [
                    {
                        func: "{getAfterRestartRequest}.send",
                        args:     []
                    },
                    {
                        event:    "{getAfterRestartRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The record should still be found.", "{that}.options.persistenceRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            },
            {
                name: "Confirm that we have indexed records after a restart...",
                type: "test",
                sequence: [
                    {
                        func: "{getViewAfterRestartRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getViewAfterRestartRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The status code should be as expected...", { total_rows: 1 }, "@expand:JSON.parse({arguments}.0)"]
                    },
                    {
                        func: "jqUnit.assertEquals",
                        args:     ["The status code should be as expected...", 200, "{getViewAfterRestartRequest}.nativeResponse.statusCode"]
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
            },
            {
                name: "Confirm that we have no indexed records after a reset...",
                type: "test",
                sequence: [
                    {
                        func: "{getViewAfterResetRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getViewAfterResetRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The status code should be as expected...", { total_rows: 0 }, "@expand:JSON.parse({arguments}.0)"]
                    },
                    {
                        func: "jqUnit.assertEquals",
                        args:     ["The status code should be as expected...", 200, "{getViewAfterResetRequest}.nativeResponse.statusCode"]
                    }
                ]
            },
            {
                name: "Clean up at the end of the run...",
                type: "test",
                sequence: [
                    {
                        task:        "{harness}.cleanup",
                        resolve:     "jqUnit.assert",
                        resolveArgs: ["The final cleanup should complete as expexted"]
                    }
                ]
            }
        ]
    }],
    components: {
        getViewBeforeInsertRequest: {
            type: "gpii.tests.pouch.persistent.request.view"
        },
        insertRequest: {
            type: "gpii.tests.pouch.persistent.request",
            options: {
                method: "PUT"
            }
        },
        getAfterInsertRequest: {
            type: "gpii.tests.pouch.persistent.request"
        },
        getViewAfterInsertRequest: {
            type: "gpii.tests.pouch.persistent.request.view"
        },
        getAfterRestartRequest: {
            type: "gpii.tests.pouch.persistent.request"
        },
        getViewAfterRestartRequest: {
            type: "gpii.tests.pouch.persistent.request.view"
        },
        getAfterResetRequest: {
            type: "gpii.tests.pouch.persistent.request"
        },
        getViewAfterResetRequest: {
            type: "gpii.tests.pouch.persistent.request.view"
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
    hangWait:   15000,
    pouchConfig: {
        databases: {
            persistence: { data: ["%gpii-pouchdb/tests/data/persistence"]}
        }
    },
    // We cannot use the normal logic to determine whether to delete the test directory, as we intentionally persist it
    // between runs.  Manually setting the following option will ensure that when we do eventually call cleanup, it will
    // be aggressive enough.
    distributeOptions: [
        {
            record: true,
            target: "{that gpii.pouch.express.base}.options.members.baseDirBelongsToUs"
        }
    ]
});

fluid.test.runTests("gpii.tests.pouch.persistent.environment");
