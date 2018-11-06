/*

    Tests covering easily-tested error handling in the new docker-based CouchDB harness.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../../../");

var jqUnit = require("node-jqunit");

jqUnit.module("Failure mode tests for CouchDB docker harness.");

fluid.registerNamespace("gpii.tests.harness.failure");

gpii.tests.harness.failure.testSingleTestDef = function (testDef) {
    jqUnit.test(testDef.message, function () {
        jqUnit.stop();
        var promiseOrFn = fluid.invokeGlobalFunction(testDef.funcName, testDef.args);
        var promise = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
        promise.then(
            function () {
                jqUnit.start();
                jqUnit.fail("The promise should not have been resolved.");
            },
            function () {
                jqUnit.start();
                jqUnit.assert("The promise should have been rejected.");
            }
        );
    });
};

gpii.tests.harness.failure.runTests = function (that) {
    fluid.each(that.options.testDefs, gpii.tests.harness.failure.testSingleTestDef);
};

fluid.defaults("gpii.tests.harness.failure.testRunner", {
    gradeNames: ["fluid.component"],
    testDefs: {
        detectPort: {
            message: "Test error handling in `gpii.pouch.harness.detectPort`.",
            funcName: "gpii.pouch.harness.detectPort",
            args: [{}, Date.now()]
        },
        dataCleanup: {
            message:  "Test error handling in `gpii.pouch.harness.cleanExistingData`.",
            funcName: "gpii.pouch.harness.cleanExistingData",
            args:     [{}]
        },
        runCommandAsPromise: {
            message:  "Test error handling in `gpii.pouch.harness.runCommandAsPromise`.",
            funcName: "gpii.pouch.harness.runCommandAsPromise",
            args:     ["halt and catch fire", {}]
        },
        constructCouch: {
            message:  "Test error handling in `gpii.pouch.harness.constructCouchReadyPromise`.",
            funcName: "gpii.pouch.harness.constructCouchReadyPromise",
            args:     [{ couchPort: 5050, options: { couchSetupTimeout:250, couchSetupCheckInterval: 100 } }]
        },
        dataLoading: {
            message:  "Test error handling in `gpii.pouch.harness.constructDataLoadingPromise`.",
            funcName: "gpii.pouch.harness.constructDataLoadingPromise",
            args:     ["http://localhost:5050/", "nonsense", {}] // dbUrl, dbName, dbDef
        }
    },
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.tests.harness.failure.runTests",
            args:     ["{that}"]
        }
    }
});

gpii.tests.harness.failure.testRunner();
