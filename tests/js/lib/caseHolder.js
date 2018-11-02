/*

    A caseholder for use with `gpii.pouch.harness`, which:

    1. Starts the harness before the first test.
    2. Stops the harness after the last test.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.pouchdb.caseHolder.expandModules");

/**
 *
 * Add sequence steps surrounding a test run.
 *
 * @param {Object} rawModules - Fluid IoC test definitions.
 * @param {Array} beforeFirstTest - Test sequence steps to execute at the beginning of the very first test.
 * @param {Array} afterLastTest - Test sequence steps to execute at the end of the very last test.
 * @return {Object} - The expanded test definitions with the prepended and appended steps.
 *
 */
gpii.test.pouchdb.caseHolder.expandModules = function (rawModules, beforeFirstTest, afterLastTest) {
    var expandedModules = fluid.copy(rawModules);

    if (expandedModules.length > 0) {
        var firstTest = expandedModules[0];
        var updatedFirstSequence = fluid.makeArray(beforeFirstTest).concat(firstTest.tests[0].sequence);
        expandedModules[0].tests[0].sequence = updatedFirstSequence;

        var lastTest = expandedModules[expandedModules.length - 1];
        var lastTestSequence = lastTest.tests[lastTest.tests.length - 1].sequence;
        var updatedLastSequence = lastTestSequence.concat(fluid.makeArray(afterLastTest));
        expandedModules[expandedModules.length - 1].tests[lastTest.tests.length - 1].sequence = updatedLastSequence;
    }

    return expandedModules;
};

fluid.defaults("gpii.test.pouchdb.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    mergePolicy: {
        beforeFirstTest: "noexpand, nomerge",
        afterLastTest:   "noexpand, nomerge",
        rawModules:      "noexpand, nomerge"
    },
    beforeFirstTest: [
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onHarnessReady"
        }
    ],
    afterLastTest: [
        {
            func: "{harness}.shutdown"
        },
        {
            listener: "fluid.identity",
            event: "{harness}.events.onShutdownComplete"
        }
    ],
    moduleSource: {
        funcName: "gpii.test.pouchdb.caseHolder.expandModules",
        args: ["{that}.options.rawModules", "{that}.options.beforeFirstTest", "{that}.options.afterLastTest"]
    }
});
