"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../js/harness");

fluid.registerNamespace("gpii.test.pouch.environment");

gpii.test.pouch.environment.startCleanups = function (that) {
    that.harness.express.expressPouch.events.onCleanup.fire();
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
        onCleanup:         null,
        onCleanupComplete: null
    },
    listeners: {
        "onCleanup.cleanup": {
            funcName: "gpii.test.pouch.environment.startCleanups",
            args:     ["{that}"]
        }
    },
    components: {
        harness: {
            type: "gpii.pouch.harness",
            createOnEvent: "constructFixtures",
            options: {
                port:       "{testEnvironment}.options.port",
                listeners: {
                    onReady: "{testEnvironment}.events.onHarnessReady.fire"
                },
                components: {
                    express: {
                        options: {
                            components: {
                                expressPouch: {
                                    options: {
                                        listeners: {
                                            onCleanupComplete: {
                                                func: "{testEnvironment}.events.onCleanupComplete.fire"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});
