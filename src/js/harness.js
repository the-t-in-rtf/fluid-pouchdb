/* eslint-env node */
// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
//
// NOTE:  This grade uses an "in memory" database and explicitly clears out the data on every run.  If you need to
// persist data between runs, you should use the `gpii.pouch.harness` grade instead.
//
"use strict";
var fluid = require("infusion");

require("gpii-express");
fluid.require("%gpii-pouchdb");

var path = require("path");
var os   = require("os");

var defaultDir = path.resolve(os.tmpdir(), "gpii-pouch-express-persistent");

fluid.defaults("gpii.pouch.harness", {
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
        express: {
            type: "gpii.express",
            options: {
                "port" : "{harness}.options.port",
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
                },
                components: {
                    expressPouch: {
                        type: "gpii.pouch.express",
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

fluid.defaults("gpii.pouch.harness.persistent", {
    gradeNames: ["gpii.pouch.harness"],
    baseDir:    defaultDir,
    distributeOptions: [
        {
            source: "{that}.options.baseDir",
            target: "{that gpii.pouch.express}.options.baseDir"
        }
    ],
    invokers: {
        cleanup: {
            func: "{that}.express.expressPouch.cleanup"
        }
    }
});
