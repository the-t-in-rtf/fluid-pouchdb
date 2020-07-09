/* eslint-env node */
// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");

require("../../");
fluid.require("%fluid-pouchdb/src/js/harness");
require("./pouch-config.js");

fluid.setLogging(true);

fluid.pouch.harness.persistent({
    port: 6789,
    pouchConfig: {
        databases: fluid.tests.pouch.config.databases
    },
    distributeOptions: [
        {
            source: "{that}.options.pouchConfig",
            target: "{that fluid.pouch.express}.options"
        }
    ],
    listeners: {
        "onCreate.log": {
            funcName: "fluid.log",
            args: ["baseDir:", "{that}.express.expressPouch.options.baseDir"]
        }
    }
});
