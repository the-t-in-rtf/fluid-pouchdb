/* eslint-env node */
// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("../../");
fluid.require("%gpii-pouchdb/src/js/harness");
require("./pouch-config.js");

fluid.setLogging(true);

gpii.pouch.harness({
    port: 6789,
    databases: gpii.tests.pouch.config.databases,
    listeners: {
        "onDestroy.cleanup": {
            func: "{that}.events.onCleanup.fire"
        }
    }
});
