/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("../js/harness");

fluid.registerNamespace("gpii.test.pouch.environment");

fluid.defaults("gpii.test.pouch.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       6792,
    baseUrl:    {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/", { port: "{that}.options.port" }]
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.pouchConfig",
            target: "{that gpii.pouch.harness}.options"
        },
        {
            source: "{that}.options.harnessGrades",
            target: "{that > gpii.pouch.harness}.options.gradeNames"
        }
    ],
    events: {
        onHarnessReady: null
    },
    components: {
        harness: {
            type: "gpii.pouch.harness",
            options: {
                port: "{testEnvironment}.options.port",
                listeners: {
                    "onReady.notifyParent": "{testEnvironment}.events.onHarnessReady.fire"
                }
            }
        }
    }
});
