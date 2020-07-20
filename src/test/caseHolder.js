/* eslint-env node */
/*

    Caseholders to ensure that tests run against fluid-pouchdb are kept distinct from one another, so that you can be
    confident you are not running your tests against a previous instance or data set.

    1. Explicitly removes all data between runs.
    2. Waits for data to be cleaned up before exiting.
    3. Waits for pouch and express to shut down before exiting.

 */
"use strict";
var fluid = require("infusion");

fluid.registerNamespace("fluid.test.pouch.caseHolder");

// A series of test sequence steps that will clear out any existing data.  Designed for use with caseHolders that extend
// fluid.test.express.caseHolder, which have the ability to wire "start" and "end" sequence steps before and after each
// test's "body".
fluid.test.pouch.caseHolder.cleanupSequence = [
    {
        func: "{testEnvironment}.events.onCleanup.fire",
        args: []
    },
    {
        event:    "{testEnvironment}.events.onCleanupComplete",
        listener: "fluid.log",
        args:     ["Database cleanup complete..."]
    }
];

fluid.defaults("fluid.test.pouch.caseHolder.base", {
    gradeNames: ["fluid.test.express.caseHolder"]
});

fluid.defaults("fluid.test.pouch.caseHolder", {
    gradeNames: ["fluid.test.pouch.caseHolder.base"],
    sequenceEnd: fluid.test.pouch.caseHolder.cleanupSequence
});
