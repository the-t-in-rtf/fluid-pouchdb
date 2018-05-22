/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-testem");

fluid.defaults("gpii.pouchdb.testem", {
    gradeNames: ["gpii.testem.instrumentation"],
    testPages:  ["tests/js/pouchdb-component-tests/html/index.html"],
    sourceDirs: { src: "%gpii-pouchdb/src" },
    coverageDir: "%gpii-pouchdb/coverage",
    contentDirs: {
        nm: "%gpii-pouchdb/node_modules",
        tests: "%gpii-pouchdb/tests"
    },
    testemOptions: {
        tap_quiet_logs: true,
        disable_watching: true,
        skip: "PhantomJS,Opera,Safari,IE"
    }
});

module.exports = gpii.pouchdb.testem().getTestemOptions();
