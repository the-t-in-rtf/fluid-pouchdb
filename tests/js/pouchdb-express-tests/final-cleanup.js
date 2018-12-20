// An additional cleanup step required to pick up straggling _user lockfiles and logs in Windows.
// See: https://github.com/GPII/gpii-pouchdb/pull/13#issuecomment-278364757
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var fs     = require("fs");

var jqUnit = require("node-jqunit");

var kettle = require("kettle");
kettle.loadTestingSupport();

fluid.require("%gpii-pouchdb/src/js/harness.js");

jqUnit.module("Test cleaning up after the tests.");

jqUnit.test("Clean up should happen if it's needed.", function () {
    var harnessOptions = fluid.defaults("gpii.pouch.harness.persistent");

    if (fs.existsSync(harnessOptions.baseDir)) {
        fluid.log("Cleaning up straggling filesystem content in '", harnessOptions.baseDir, "'...");

        try {
            kettle.test.deleteFolderRecursive(harnessOptions.baseDir);
            jqUnit.assert("Removed straggling base dir...");
        }
        catch (error) {
            jqUnit.fail("Unable to remove directory '" + harnessOptions.baseDir + "'...");
        }
    }
    else {
        jqUnit.assert("Nothing to remove, which is just fine.");
    }
});
