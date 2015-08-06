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

    var initWork = function () {
        delete PouchDB.isBeingCleaned;
        var promises = [];
        fluid.each(that.options.databases, function (dbConfig, key) {
            var db = new MemPouchDB(key);
            that.databaseInstances[key] = db;
            if (dbConfig.data) {
                var data = require(dbConfig.data);
                promises.push(db.bulkDocs(data));
            }
        });

        when.all(promises).then(function () {
            that.events.onStarted.fire();
        });
    };

    if (PouchDB.isBeingCleaned) {
        fluid.log("Waiting for the last run to finish its cleanup...");
        PouchDB.isBeingCleaned.then(initWork);
    }
    else {
        fluid.log("No previous run detected. Continuing with the normal startup...");
        initWork();
    }
};

gpii.pouch.getRouter = function (that) {
    return that.expressPouchdb;
};

// Remove all data from each database between runs, otherwise we encounter problems with data leaking between tests.
//
// https://github.com/pouchdb/pouchdb/issues/4124
//
gpii.pouch.cleanup = function (that) {
    if (PouchDB.isBeingCleaned) {
        fluid.fail("Cannot clean up onDestroy unless the previous instance has already finished its own cleanup.");
    }

    var promises = [];
    fluid.each(that.databaseInstances, function (db, key) {
            // If we use the simpler method, the next attempt to recreate the database fails with a 409 document update conflict.
            //var promise = db.destroy();

            // Instead, we retrieve the list of all document IDs and revisions, and then bulk delete them.
            var promise = db.allDocs()
                .then(function (result) {
                    var bulkPayloadDocs = fluid.transform(result.rows, gpii.pouch.transformRecord);
                    var bulkPayload     = {docs: bulkPayloadDocs};
                    return db.bulkDocs(bulkPayload);
                })
                .then(function () {
                    fluid.log("Deleted existing data from database '" + key + "'...");
                    return db.compact();
                })
                .then(function () {
                    fluid.log("Compacted existing database '" + key + "'...");
                })
                .catch(fluid.fail); // jshint ignore:line

            promises.push(promise);
        }
    );

    // Make sure that the next instance of pouch knows to wait for us to finish cleaning up.
    PouchDB.isBeingCleaned = when.all(promises);
};

gpii.pouch.transformRecord = function (record) {
    // We cannot use "that" or its options here because we have already been destroyed by the time this function is called.
    var rules = {
        _id:  "id",
        _rev: "value.rev",
        _deleted: {
            transform: {
                type: "fluid.transforms.literalValue",
                value: true
            }
        }
    };

    return fluid.model.transformWithRules(record, rules);
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
        databaseInstances: {} // The actual PouchDB databases
    },
    databases: {}, // The configuration we will use to create the required databases on startup.
    listeners: {
        onCreate: {
            funcName: "gpii.pouch.init",
            args:     ["{that}"]
        },
        onDestroy: {
            func: "{that}.cleanup"
        }
    },
    invokers: {
        "getRouter": {
            funcName: "gpii.pouch.getRouter",
            args:     ["{that}"]
        },
        "cleanup": {
            funcName: "gpii.pouch.cleanup",
            args:     ["{that}"]
        }
    }
});

