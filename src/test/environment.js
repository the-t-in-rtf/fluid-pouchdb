var fluid = require("infusion");

require("./harness");

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
            target: "{that gpii.pouch}.options"
        },
        {
            source: "{that}.options.harnessGrades",
            target: "{that > gpii.test.pouch.harness}.options.gradeNames"
        }
    ],
    events: {
        constructFixtures: null,
        onHarnessReady: null,
        onFixturesConstructed: {
            events: {
                onHarnessReady: "onHarnessReady"
            }
        }
    },
    components: {
        harness: {
            type: "gpii.test.pouch.harness",
            createOnEvent: "constructFixtures",
            options: {
                port:       "{testEnvironment}.options.port",
                listeners: {
                    onReady: "{testEnvironment}.events.onHarnessReady.fire"
                }
            }
        }
    }
});