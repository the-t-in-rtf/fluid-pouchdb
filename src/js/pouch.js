// Utility functions to add pouch to an existing express instance
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.pouch");

var PouchDB        = require("pouchdb");
var memdown        = require("memdown");
var expressPouchdb = require("express-pouchdb");
var os             = require("os");
var path           = require("path");
var fs             = require("fs");

// We want to output our generated config file to the temporary directory instead of the working directory.
var pouchConfigPath = path.resolve(os.tmpdir(), "config.json");
var pouchLogPath    = path.resolve(os.tmpdir(), "log.txt");


gpii.pouch.init = function (that) {
    // There are unfortunately options that can only be configured via a configuration file.
    //
    // To allow ourselves (and users configuring and extending this grade) to control these options, we create the file
    // with the contents of options.pouchConfig before configuring and starting express-pouchdb.
    //
    fs.writeFileSync(that.options.pouchConfigPath, JSON.stringify(that.options.pouchConfig, null, 2));

    var MemPouchDB = PouchDB.defaults({ db: memdown });

    fluid.each(that.options.databases, function (dbConfig, key) {
        var db = new MemPouchDB(key);
        if (dbConfig.data) {
            var data = require(dbConfig.data);
            db.bulkDocs(data);
        }
    });

    that.expressPouchdb = expressPouchdb(MemPouchDB, { configPath: pouchConfigPath });

    //that.expressPouchdb.couchLogger.setFile(logPath);

    that.events.onStarted.fire();
};

gpii.pouch.getRouter = function (that) {
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
    gradeNames:      ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    config:          "{gpii.express}.options.config",
    path:             "/",
    pouchConfigPath: pouchConfigPath,
    pouchConfig: {
        log: {
            file: pouchLogPath
        }
    },
    events: {
        onStarted: null
    },
    databases: {},
    listeners: {
        onCreate: {
            funcName: "gpii.pouch.init",
            args:     ["{that}"]
        }
    },
    invokers: {
        "getRouter": {
            funcName: "gpii.pouch.getRouter",
            args: ["{that}"]
        }
    }
});

