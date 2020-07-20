// An additional cleanup step required to pick up straggling _user lockfiles and logs in Windows.
// See: https://github.com/fluid-project/fluid-pouchdb/pull/13#issuecomment-278364757
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var rimraf = require("rimraf");
var fs     = require("fs");

fluid.require("%fluid-pouchdb/src/js/harness.js");

var harnessOptions = fluid.defaults("fluid.pouch.harness.persistent");

if (fs.existsSync(harnessOptions.baseDir)) {
    fluid.log("Cleaning up straggling filesystem content in '", harnessOptions.baseDir, "'...");
    rimraf(harnessOptions.baseDir, function (error) {
        if (error) {
            fluid.fail("Unable to remove directory '" + harnessOptions.baseDir + "'...");
        }
        else {
            fluid.log("removed...");
        }
    });
}
