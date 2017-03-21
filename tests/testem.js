/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-testem");

fluid.defaults("gpii.pouchdb.testem", {
    gradeNames: ["gpii.testem.coverageDataOnly"],
    testPages:  "tests/js/pouchdb-component-tests/html/index.html",
    sourceDirs: ["src"],
    coverageDir: "%gpii-pouchdb/coverage",
    reportsDir: "reports",
    serveDirs:  ["src", "node_modules"],
    testemOptions: {
        "framework":   "qunit",
        "parallel":    1
    }
});

module.exports = gpii.pouchdb.testem().getTestemOptions();
