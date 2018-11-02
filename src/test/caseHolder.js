/* eslint-env node */
/*

    Caseholders to ensure that tests run against gpii-pouchdb are kept distinct from one another, so that you can be
    confident you are not running your tests against a previous instance or data set.

    1. Explicitly removes all data between runs.
    2. Waits for data to be cleaned up before exiting.
    3. Waits for pouch and express to shut down before exiting.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.pouch.caseHolder");

// A series of test sequence steps that will clear out any existing data.  Designed for use with caseHolders that extend
// gpii.test.express.caseHolder, which have the ability to wire "start" and "end" sequence steps before and after each
// test's "body".
gpii.test.pouch.caseHolder.cleanupSequence = [
    {
        func: "{testEnvironment}.harness.events.onCleanup.fire",
        args: []
    },
    {
        event:    "{testEnvironment}.events.onCleanupComplete",
        listener: "fluid.log",
        args:     ["Database cleanup complete..."]
    }
];

fluid.defaults("gpii.test.pouch.caseHolder.base", {
    gradeNames: ["gpii.test.express.caseHolder"]
});

fluid.defaults("gpii.test.pouch.caseHolder", {
    gradeNames: ["gpii.test.pouch.caseHolder.base"],
    sequenceEnd: gpii.test.pouch.caseHolder.cleanupSequence
});
