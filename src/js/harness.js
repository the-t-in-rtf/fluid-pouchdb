/* eslint-env node */
// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
//
// NOTE:  This grade uses an "in memory" database and explicitly clears out the data on every run.  If you need to
// persist data between runs, you should use the `fluid.pouch.harness` grade instead.
//
"use strict";
var fluid = require("infusion");

require("fluid-express");
fluid.require("%fluid-pouchdb");

var path = require("path");
var os   = require("os");

var defaultDir = path.resolve(os.tmpdir(), "fluid-pouch-express-persistent");

fluid.defaults("fluid.pouch.harness", {
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
            type: "fluid.express",
            options: {
                "port" : "{harness}.options.port",
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
                },
                components: {
                    expressPouch: {
                        type: "fluid.pouch.express",
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

fluid.defaults("fluid.pouch.harness.persistent", {
    gradeNames: ["fluid.pouch.harness"],
    baseDir:    defaultDir,
    distributeOptions: [
        {
            source: "{that}.options.baseDir",
            target: "{that fluid.pouch.express}.options.baseDir"
        }
    ],
    invokers: {
        cleanup: {
            func: "{that}.express.expressPouch.cleanup"
        }
    }
});
