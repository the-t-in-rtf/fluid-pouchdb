// Utility functions to add pouch to an existing express instance
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.pouch");

var PouchDB        = require("pouchdb");
var memdown        = require("memdown");
var expressPouchdb = require("express-pouchdb");

gpii.pouch.init = function(that) {
    var MemPouchDB = PouchDB.defaults({db: memdown });

    if (that.model.databases && Object.keys(that.model.databases).length > 0) {
        Object.keys(that.model.databases).forEach(function(key){
            var dbConfig = that.model.databases[key];
            var db = new MemPouchDB(key);
            if (dbConfig.data) {
                var data = require(dbConfig.data);
                db.bulkDocs(data);
            }
        });
    }

    that.expressPouchdb = expressPouchdb(MemPouchDB);

    // Sadly, expressPouchdb does not provide a ready event or callback.  We have to manually enforce a waiting period by waiting to fire our "started" event.
    setTimeout(function() { that.events.started.fire(); },500);
};

gpii.pouch.getRouterFunction = function(that) {
    return that.expressPouchdb;
};


// TODO:  Write a change listener to allow easy adding of new databases

/*
    The "databases" option is expected to be an array keyed by dbName, with options to control whether data is loaded or not, as in:

    databases: {
        "nodata": {},
        "data":   { "data": "../tests/data/records.json" }
    }
 */
fluid.defaults("gpii.pouch", {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    config:     "{gpii.express}.options.config",
    path:      "/",
    events: {
        started: null
    },
    model: {
        router:    null,
        databases: {}
    },
    listeners: {
        onCreate: {
            funcName: "gpii.pouch.init",
            args:     ["{that}"]
        }
    },
    invokers: {
        "getRouterFunction": {
            funcName: "gpii.pouch.getRouterFunction",
            args: ["{that}"]
        }
    }
});

