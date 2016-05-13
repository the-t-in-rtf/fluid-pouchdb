// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
"use strict";
var fluid = require("infusion");

require("gpii-express");
fluid.require("%gpii-pouchdb");

fluid.defaults("gpii.test.pouch.harness", {
    gradeNames: ["fluid.component"],
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
                "port" : "{harness}.options.port",
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
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

