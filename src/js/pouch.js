/*

    Provide a CouchDB-like API using `PouchDB` and `express-pouchdb`.  This in only useful in association with an
    existing `gpii.express` instance.  See the documentation for details:

    https://github.com/GPII/gpii-pouchdb/blob/master/docs/pouch-component.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.pouch");

/*

    TODO: In summmary...

    1. Separate the express-pouchdb initialization and middleware bits from pouch itself.
    2. Separate the node-specific parts of the pouch component from the base browser-safe parts.
    3. Add browser tests.

 */

// TODO:  Isolate this node-specific set of requires from a base "common" grade
var os             = require("os");
var path           = require("path");
var fs             = require("fs");
var memdown        = require("memdown");

// TODO:  The "base" grade should not make use of express pouchdb.  Cleanly separate pouch from its middleware wrapper.
var expressPouchdb = require("express-pouchdb");

// TODO:  This should be part of the "base" grade
// TODO:  This should be a client-first include, ala `PouchDB = PouchDB || require("pouchdb")`
var PouchDB        = require("pouchdb");

// TODO:  Isolate this to the node-specific parts of the grade
// We want to output our generated config file to the temporary directory instead of the working directory.
var expressPouchConfigPath = path.resolve(os.tmpdir(), "config.json");
var pouchLogPath           = path.resolve(os.tmpdir(), "log.txt");

/**
 *
 * Initialize our express-pouchdb instance and all databases.
 *
 * @param that {Object} The `gpii.pouch` component itself.
 */
// TODO:  Isolate the express-pouchdb and pouch initialization from each other
gpii.pouch.init = function (that) {
    // There are unfortunately options that can only be configured via a configuration file.
    //
    // To allow ourselves (and users configuring and extending this grade) to control these options, we create the file
    // with the contents of options.pouchConfig before configuring and starting express-pouchdb.
    //
    // TODO:  Isolate this from the pouch initialization
    fs.writeFileSync(that.options.expressPouchConfigPath, JSON.stringify(that.options.expressPouchConfig, null, 2));

    var uniqueOptions    = fluid.copy(that.options.dbOptions);
    uniqueOptions.prefix = that.id;
    var MyPouchDB        = PouchDB.defaults(uniqueOptions);

    // TODO: Isolate the express-pouchdb initialization from the pouch initialization
    that.expressPouchdb  = expressPouchdb(MyPouchDB, { configPath: expressPouchConfigPath });

    var initWork = function () {
        delete PouchDB.isBeingCleaned;
        var promises = [];
        fluid.each(that.options.databases, function (dbConfig, key) {
            var db = new MyPouchDB(key);
            that.databaseInstances[key] = db;
            if (dbConfig.data) {
                var dataSetPaths = fluid.makeArray(dbConfig.data);
                fluid.each(dataSetPaths, function (dataSetPath) {
                    var data = fluid.require(dataSetPath);
                    promises.push(db.bulkDocs(data));
                });
            }
        });

        fluid.promise.sequence(promises).then(function () {
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

gpii.pouch.middleware = function (that, req, res, next) {
    that.expressPouchdb(req, res, next);
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
        var promise = db.destroy()
            .then(function () {
                fluid.log("Destroyed database '" + key + "'...");
            })["catch"](fluid.fail);

        promises.push(promise);
    });

    // Make sure that the next instance of pouch knows to wait for us to finish cleaning up.
    PouchDB.isBeingCleaned = fluid.promise.sequence(promises);
};

fluid.defaults("gpii.pouch", {
    gradeNames: ["fluid.component", "gpii.express.middleware"],
    method: "use", // We have to support all HTTP methods, as does our underlying router.
    path: "/",
    namespace: "pouch", // Namespace to allow other routers to put themselves in the chain before or after us.
    expressPouchConfigPath: expressPouchConfigPath,
    expressPouchConfig: {
        log: {
            file: pouchLogPath
        }
    },
    // Options to use when creating individual databases.
    dbOptions: {
        auto_compaction: true,
        db: memdown // TODO:  This option only belongs as a default for a test grade in ../test.  We need tested settings for a persistant databse
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
        middleware: {
            funcName: "gpii.pouch.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // request, response, next
        },
        cleanup: {
            funcName: "gpii.pouch.cleanup",
            args:     ["{that}"]
        }
    }
});

