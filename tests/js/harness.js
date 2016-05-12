// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("../../");


fluid.defaults("gpii.test.pouch.harness", {
    gradeNames: ["fluid.component"],
    databases: {
        sample:  { data: [ "%gpii-pouchdb/tests/data/data.json", "%gpii-pouchdb/tests/data/supplemental.json"] },
        _users:  { data: "%gpii-pouchdb/tests/data/users.json"},
        // A ~100k data set to confirm that the async data loads do not take too long.
        massive: { data: "%gpii-pouchdb/tests/data/massive.json"},
        nodata:  {}
    },
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
                baseUrl: "{harness}.options.baseUrl",
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: "{harness}.options.databases",
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

