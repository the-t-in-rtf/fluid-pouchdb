/*

    Confirm that a new instance using the same path and the `gpii.pouch.express.checkFileSystemOnDbCreation` grade
    will end up with the same data.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
fluid.setLogging(true);
var gpii   = fluid.registerNamespace("gpii");

var os     = require("os");
var path   = require("path");
var dbPath = path.resolve(os.tmpdir(), "persistent") + "/";

require("../../");

gpii.pouch.loadTestingSupport();

var jqUnit = require("node-jqunit");

jqUnit.module("Testing filesystem persistence...");

fluid.defaults("gpii.tests.pouchdb.checkFileSystemOnDbCreation", {
    gradeNames: ["gpii.pouch.express.checkFileSystemOnDbCreation"],
    databases: {
        sample: ""
    }
});

fluid.defaults("gpii.tests.pouch.persistent.caseHolder.base", {
    gradeNames: ["gpii.test.express.caseHolder"],
    sampleRecord: { _id: "new", foo: "bar"},
    components: {
        getRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/new",
                method: "GET"
            }
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.caseHolder.insertRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.caseHolder.base"],
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
                        func: "{getRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The record should be readable", "{that}.options.sampleRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            }
        ]
    }],
    components: {
        insertRequest: {
            type: "gpii.test.pouch.request",
            options: {
                path:   "/sample/new",
                method: "PUT"
            }
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.caseHolder.clearData", {
    gradeNames: ["gpii.tests.pouch.persistent.caseHolder.base"],
    sequenceEnd: gpii.test.pouch.caseHolder.standardSequenceEnd,
    rawModules: [{
        name: "Testing persistence across restarts...",
        tests: [
            {
                name: "Go through a single run and destroy all data...",
                type: "test",
                sequence: [
                    {
                        func: "jqUnit.assert",
                        args: ["Cleanup completed successfully..."]
                    }
                ]
            }
        ]
    }]
});

fluid.defaults("gpii.tests.pouch.persistent.caseHolder.shouldHaveRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.caseHolder.base"],
    rawModules: [{
        name: "Testing persistence across restarts...",
        tests: [
            {
                name: "Confirm that the record is still there after a restart...",
                type: "test",
                sequence: [
                    {
                        func: "{getRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getRequest}.events.onComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The record should still be found.", "{that}.options.sampleRecord", "@expand:JSON.parse({arguments}.0)"]
                    }
                ]
            }
        ]
    }]
});

fluid.defaults("gpii.tests.pouch.persistent.caseHolder.shouldNotHaveRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.caseHolder.base"],
    rawModules: [{
        name: "Confirming that the record is not found...",
        tests: [
            {
                name: "Confirm that the record is no longer there...",
                type: "test",
                sequence: [
                    {
                        func: "{getRequest}.send",
                        args: []
                    },
                    {
                        event:    "{getRequest}.events.onComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["There should no longer be a record.", 404, "{getRequest}.nativeResponse.statusCode"]
                    }
                ]

            }
        ]
    }]
});

fluid.defaults("gpii.tests.pouch.persistent.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    port:       6798,
    pouchConfig: {
        databases: { sample:  {} }
    },
    distributeOptions: {
        record: dbPath,
        target: "{that gpii.pouch.express}.options.dbPath"
    },
    components: {
        harness: {
            type: "gpii.pouch.harness"
        },
        testCaseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder.insertRecord"
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.environment.insertRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder.insertRecord"
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.environment.clearData", {
    gradeNames: ["gpii.tests.pouch.persistent.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder.clearData"
        }
    }
});


fluid.defaults("gpii.tests.pouch.persistent.environment.shouldHaveRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder.shouldHaveRecord"
        }
    }
});

fluid.defaults("gpii.tests.pouch.persistent.environment.shouldNotHaveRecord", {
    gradeNames: ["gpii.tests.pouch.persistent.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.pouch.persistent.caseHolder.shouldNotHaveRecord"
        }
    }
});

fluid.test.runTests("gpii.tests.pouch.persistent.environment.clearData");
fluid.test.runTests("gpii.tests.pouch.persistent.environment.shouldNotHaveRecord");
fluid.test.runTests("gpii.tests.pouch.persistent.environment.insertRecord");
fluid.test.runTests("gpii.tests.pouch.persistent.environment.shouldHaveRecord");
fluid.test.runTests("gpii.tests.pouch.persistent.environment.clearData");
// fluid.test.runTests("gpii.tests.pouch.persistent.environment.shouldNotHaveRecord");
