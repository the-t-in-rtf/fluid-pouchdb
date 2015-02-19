// Utility functions to add pouch to an existing express instance
"use strict";
var fluid          = require('infusion');
var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace(namespace);

var PouchDB        = require("pouchdb");
var memdown        = require('memdown');
var expressPouchdb = require('express-pouchdb');

gpii.pouch.addRoutesPrivate = function(that) {
    if (!that.options.path) {
        console.error("You must configure a path for a gpii.express.router grade...");
        return null;
    }

    if (!that.model.router) {
        console.error("Our router must be configured before we attempt to add our routes.");
        return null;
    }

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

    that.model.router.use(that.options.path, expressPouchdb(MemPouchDB));
};

// TODO:  Write a change listener to allow easy adding of new databases

/*
    The 'databases' option is expected to be an array keyed by dbName, with options to control whether data is loaded or not, as in:

    databases: {
        "nodata": {},
        "data":   { "data": "../tests/data/records.json" }
    }
 */
fluid.defaults("gpii.pouch", {
    gradeNames: ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    config:     "{gpii.express}.options.config",
    path:      "/",
    model: {
        router:    null,
        databases: {}
    },
    listeners: {
        "addRoutes": {
            funcName: "gpii.pouch.addRoutesPrivate",
            args: ["{that}"]
        }
    }
});

