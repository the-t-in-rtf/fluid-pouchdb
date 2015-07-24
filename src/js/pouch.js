// Provide a CouchDB-like API using `PouchDB` and `express-pouchdb`.  This in only useful in association with an
// existing `gpii.express` instance.
//
// The "databases" option is expected to be an array keyed by dbName, with options to control whether data is loaded or
// not, as in:
//
//  databases: {
//    "nodata": {},
//    "data":   { "data": "../tests/data/records.json" }
//  }
//
// In this example, an empty database called "nodata" would be created, and a database called "data" would be created
// and populated with the contents of "../tests/data/records.json".
//
// NOTE:
//   This module has a serious and non-obvious limitation, in that only one instance of PouchDB is created.  This
//   means that multiple test sequences may end up using the same databases.  If you use the same database names in
//   different test sequences, you may end up having the same data loaded multiple times.  To avoid this, either use
//   different database names, or specify an _id value for every record you are creating.
//
// TODO:  Examine ways to fix this within PouchDB or otherwise address.  See: https://issues.gpii.net/browse/GPII-1239
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.pouch");

var os             = require("os");
var path           = require("path");
var fs             = require("fs");
var when           = require("when");

var expressPouchdb = require("express-pouchdb");
var PouchDB        = require("pouchdb");
var memdown        = require("memdown");

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
    that.expressPouchdb = expressPouchdb(MemPouchDB, { configPath: pouchConfigPath });

    if (PouchDB.isBeingCleaned) {
        var timedOut = false;

        var failIfPouchTakesTooLong = setTimeout(function () {
            timedOut = true;
            fluid.fail("Pouch never finished being cleaned up from the last run...");
        }, 2500);

        var checkToSeeIfPouchIsClean = setInterval(function () {
            if (PouchDB.isBeingCleaned) {
                fluid.log("Waiting for pouch to clean up from previous run...");
            }
            else {
                clearInterval(checkToSeeIfPouchIsClean);

                if (timedOut) {
                    fluid.log("Pouch cleanup timed out, cannot continue initializing new instance...");
                }
                else {
                    clearTimeout(failIfPouchTakesTooLong);
                    gpii.pouch.loadData(that, MemPouchDB);
                }
            }
        }, 500);
    }
    else {
        gpii.pouch.loadData(that, MemPouchDB);
    }
};

gpii.pouch.loadData = function (that, MemPouchDB) {
    if (PouchDB.isBeingCleaned) {
        fluid.fail("I should never be allowed to load data if pouch is still being cleaned from the previous run...");
    }
    else {
        var promises = [];
        fluid.each(that.options.databases, function (dbConfig, key) {
            var db = new MemPouchDB(key);
            that.databases.push(db);

            if (dbConfig.data) {
                var data = require(dbConfig.data);
                promises.push(db.bulkDocs(data));
            }
        });

        when.all(promises).then(function () {
            that.events.onStarted.fire();
        });
    }
};

gpii.pouch.getRouter = function (that) {
    return that.expressPouchdb;
};

// Destroy our databases when we are being destroyed.  This is meant to avoid problems where previous cached data is
// visible in future runs.  See https://issues.gpii.net/browse/GPII-1239 for details.
gpii.pouch.destroyDbs = function (that) {
    PouchDB.isBeingCleaned = true;
    var promises = [];
    fluid.each(that.databases, function (db) {
        promises.push(db.destroy());
    });
    when.all(promises).then(function () {
        PouchDB.isBeingCleaned = false;
    });
};

fluid.defaults("gpii.pouch", {
    gradeNames:       ["fluid.standardRelayComponent", "gpii.express.router", "autoInit"],
    config:           "{gpii.express}.options.config",
    path:             "/",
    pouchConfigPath:  pouchConfigPath,
    pouchConfig: {
        log: {
            file: pouchLogPath
        }
    },
    events: {
        onStarted: null
    },
    members: {
        databases: []
    },
    databases: {},
    listeners: {
        onCreate: {
            funcName: "gpii.pouch.init",
            args:     ["{that}"]
        },
        "onDestroy.destroyDb": {
            func: "{that}.destroyDb"
        }
    },
    invokers: {
        "getRouter": {
            funcName: "gpii.pouch.getRouter",
            args:     ["{that}"]
        },
        "destroyDb": {
            funcName: "gpii.pouch.destroyDbs",
            args:     ["{that}"]
        }
    }
});

