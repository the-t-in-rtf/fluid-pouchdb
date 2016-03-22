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
//   By default, MemPouchDB creates a global cache, which means that you can only ever have one database instance with
//   the same name.  To work around this, this component manually cleans all database content when it is destroyed.
//   Thus, although you can set up multiple instances to test things like synchronisation,  you can only ever have one
//   database at a time that uses a particular name.  In most testCases, this should not pose a problem, as each
//   instance starts up only after the last one has finished cleanup.
//
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

    // TODO:  When this pull request is merged, we can simply clear the MemPouchDB cache: https://github.com/Level/memdown/pull/39
    var initWork = function () {
        delete PouchDB.isBeingCleaned;
        var promises = [];
        fluid.each(that.options.databases, function (dbConfig, key) {
            var db = new MemPouchDB(key);
            that.databaseInstances[key] = db;
            if (dbConfig.data) {
                var dataSets = fluid.makeArray(dbConfig.data);
                fluid.each(dataSets, function (dataSet) {
                    var data = require(fluid.module.resolvePath(dataSet));
                    promises.push(db.bulkDocs(data));
                });
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

gpii.pouch.route = function (that, req, res) {
    that.expressPouchdb(req, res);
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
    gradeNames:       ["fluid.modelComponent", "gpii.express.router"],
    config:           "{gpii.express}.options.config",
    method:           "use", // We have to support all HTTP methods, as does our underlying router.
    path:             "/",
    namespace:        "pouch", // Namespace to allow other routers to put themselves in the chain before or after us.
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
        route: {
            funcName: "gpii.pouch.route",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        cleanup: {
            funcName: "gpii.pouch.cleanup",
            args:     ["{that}"]
        }
    }
});

