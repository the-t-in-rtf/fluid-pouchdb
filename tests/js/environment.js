var fluid = require("infusion");

fluid.defaults("gpii.test.pouch.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       6792,
    baseUrl:    "http://localhost:6792/",
    testUrl:    "/sample/",
    events: {
        constructServer: null,
        onStarted: null
    },
    components: {
        harness: {
            type: "gpii.test.pouch.harness",
            createOnEvent: "constructServer",
            options: {
                port:       "{testEnvironment}.options.port",
                baseUrl:    "{testEnvironment}.options.baseUrl",
                listeners: {
                    onReady: "{testEnvironment}.events.onStarted.fire"
                }
            }
        }
    }
});