var fluid = require("infusion");

fluid.defaults("gpii.test.pouch.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       6792,
    baseUrl:    "http://localhost:6792/",
    testUrl:    "/sample/",
    events: {
        constructFixtures: null,
        onAllReady: null
    },
    components: {
        harness: {
            type: "gpii.test.pouch.harness",
            createOnEvent: "constructFixtures",
            options: {
                port:       "{testEnvironment}.options.port",
                baseUrl:    "{testEnvironment}.options.baseUrl",
                listeners: {
                    onReady: "{testEnvironment}.events.onAllReady.fire"
                }
            }
        }
    }
});