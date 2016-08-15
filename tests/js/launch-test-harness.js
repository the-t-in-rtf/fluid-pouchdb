// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../");
fluid.require("%gpii-pouchdb/src/test/test-harness");
require("./pouch-config.js");

fluid.setLogging(true);

gpii.pouch.harness({
    port: 6789,
    pouchConfig: {
        databases: gpii.tests.pouch.config.databases
    },
    distributeOptions: [
        {
            source: "{that}.options.pouchConfig",
            target: "{that gpii.pouch.express}.options"
        }
    ],
    listeners: {
        "onCreate.log": {
            funcName: "fluid.log",
            args: ["dbPath:", "{that}.express.expressPouch.options.dbPath"]
        }
    }
});
