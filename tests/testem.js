/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%fluid-testem");

fluid.defaults("fluid.pouchdb.testem", {
    gradeNames: ["fluid.testem.instrumentation"],
    testPages:  ["tests/js/pouchdb-component-tests/html/index.html"],
    sourceDirs: { src: "%fluid-pouchdb/src" },
    coverageDir: "%fluid-pouchdb/coverage",
    contentDirs: {
        nm: "%fluid-pouchdb/node_modules",
        tests: "%fluid-pouchdb/tests"
    },
    testemOptions: {
        tap_quiet_logs: true,
        disable_watching: true,
        skip: "PhantomJS,Opera,Safari,IE"
    }
});

module.exports = fluid.pouchdb.testem().getTestemOptions();
