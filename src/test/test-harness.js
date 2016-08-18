// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
//
// NOTE:  This grade uses an "in memory" database and explicitly clears out the data on every run.  If you need to
// persist data between runs, you should use the `gpii.pouch.harness` grade instead.
//
"use strict";
var fluid = require("infusion");

require("gpii-express");
fluid.require("%gpii-pouchdb");

fluid.defaults("gpii.test.pouch.harness", {
    gradeNames: ["gpii.pouch.harness"],
    distributeOptions: {
        record: ["gpii.pouch.express.singleUse"],
        target: "{that gpii.pouch.express}.options.gradeNames"
    }
});
