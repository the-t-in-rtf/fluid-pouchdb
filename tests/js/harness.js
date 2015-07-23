// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
"use strict";
var fluid = fluid || require("infusion");

require("gpii-express");
require("../../src/js/pouch");

var path = require("path");
var sampleDataFile = path.resolve(__dirname, "../data/data.json");

fluid.defaults("gpii.pouch.tests.harness", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    port:       6789,
    baseUrl:    "http://localhost:6789/",
    events: {
        expressStarted: null,
        pouchStarted:   null,
        onReady: {
            events: {
                expressStarted: "expressStarted",
                pouchStarted:   "pouchStarted"
            }
        }
    },
    components: {
        pouch: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        "port" : "{harness}.options.port",
                        baseUrl: "{harness}.options.baseUrl"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "{harness}.options.baseUrl"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                sample:  { data: sampleDataFile }
                            },
                            listeners: {
                                onStarted: "{harness}.events.pouchStarted.fire"
                            }
                        }
                    }
                }
            }
        }
    }
});