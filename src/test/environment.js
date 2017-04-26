/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../js/harness");

fluid.registerNamespace("gpii.test.pouch.environment");

gpii.test.pouch.environment.stopFixtures = function (that) {
    that.harness.events.stopFixtures.fire();
};

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
            target: "{that gpii.pouch.express.base}.options"
        },
        {
            source: "{that}.options.harnessGrades",
            target: "{that > gpii.pouch.harness}.options.gradeNames"
        }
    ],
    events: {
        constructFixtures: null,
        onHarnessReady: null,
        onFixturesConstructed: {
            events: {
                onHarnessReady: "onHarnessReady"
            }
        },
        stopFixtures: null,
        onHarnessStopped: null,
        onFixturesStopped: {
            events: {
                onHarnessStopped: "onHarnessStopped"
            }
        }
    },
    components: {
        harness: {
            type: "gpii.pouch.harness",
            createOnEvent: "constructFixtures",
            options: {
                port:       "{testEnvironment}.options.port",
                listeners: {
                    onReady: "{testEnvironment}.events.onHarnessReady.fire",
                    onFixturesStopped: "{testEnvironment}.events.onHarnessStopped.fire"
                }
            }
        }
    },
    listeners: {
        "stopFixtures.stopHarness": {
            funcName: "gpii.test.pouch.environment.stopFixtures",
            args:     ["{that}"]
        }
    }
});
