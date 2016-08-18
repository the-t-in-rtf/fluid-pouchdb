/*

    Provide a CouchDB-like API using `PouchDB` and `express-pouchdb`.  This in only useful in association with an
    existing `gpii.express` instance.  See the documentation for details:

    https://github.com/GPII/gpii-pouchdb/blob/master/docs/pouch-express.md

 */
"use strict";

/*

    TODO:  Work through the express-pouchdb setup and code with Antranig, as we see many warnings like:

    `Warning: a promise was created in a handler but was not returned from it`

    The workaround for now is to set the `BLUEBIRD_WARNINGS` environment variable to `0`.

 */
process.env.BLUEBIRD_WARNINGS = 0;

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.pouch.express");

// TODO:  Isolate this node-specific set of requires from a base "common" grade
var os             = require("os");
var path           = require("path");
var fs             = require("fs");
var rimraf         = require("rimraf");
var memdown        = require("memdown");

var expressPouchdb = require("express-pouchdb");

// TODO:  This should be part of the "base" grade
// TODO:  This should be a client-first include, ala `PouchDB = PouchDB || require("pouchdb")`
var PouchDB        = require("pouchdb");

// The cleanup cycle used by express-pouchdb leaves a shedload of listeners around.  To avoid these, we disable the
// event listener warnings, but only for PouchDB itself.
PouchDB.setMaxListeners(250);

/**
 *
 * Initialize our instance of express-pouchdb.
 *
 * @param that
 * @returns {Object} - The expressPouchDB middleware.
 *
 */
gpii.pouch.express.initExpressPouchdb = function (that) {
    // Create any of our directories that don't already exist
    fluid.each([that.options.baseDir, that.options.dbPath], function (path) {
        if (path && !fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    });

    // There are unfortunately options that can only be configured via a configuration file.
    //
    // To allow ourselves (and users configuring and extending this grade) to control these options, we create the file
    // with the contents of options.pouchConfig before configuring and starting express-pouchdb.
    fs.writeFileSync(that.options.expressPouchConfigPath, JSON.stringify(that.options.expressPouchConfig, null, 2));

    that.PouchDB = PouchDB.defaults(that.options.dbOptions);
    that.expressPouchdb = expressPouchdb(that.PouchDB, { configPath: that.options.expressPouchConfigPath });

    return that.expressPouchdb;
};

/**
 *
 * Initialize all of the configured databases in `that.options.database`.
 *
 * @param that
 * @returns {Promise} - A `fluid.promise.sequence` that will be resolved when all databases are initialized.
 *
 */
gpii.pouch.express.initDbs = function (that) {
    var promises = [];
    fluid.each(that.options.databases, function (dbConfig, key) {
        var initPromise = that.initDb(key, dbConfig);
        promises.push(initPromise);
        return initPromise;
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then(function () {
        that.events.onStarted.fire();
    });

    return sequence;
};

/**
 *
 * Initialize a single database instance.
 *
 * @param that - The component itself.
 * @param dbKey {String} - The name of the database we are creating
 * @param dbOptions {Object} - The configuration options for the individual database.
 * @returns {Promise} - A promise which will be resolved when this database has been initialized.
 *
 */
gpii.pouch.express.initDb = function (that, dbKey, dbOptions) {
    var promises = [];

    that.databaseInstances[dbKey] = that.PouchDB(dbKey);

    if (dbOptions.data) {
        var dataSetPaths = fluid.makeArray(dbOptions.data);
        fluid.each(dataSetPaths, function (dataSetPath) {
            var data = fluid.require(dataSetPath);
            var bulkDocsPromise = that.databaseInstances[dbKey].bulkDocs(data);
            bulkDocsPromise["catch"](function (error) {
                fluid.fail("Error initializing database '" + dbKey + "'...", error);
            });

            promises.push(bulkDocsPromise);
            return bulkDocsPromise;
        });
    }

    return fluid.promise.sequence(promises);
};

/**
 *
 * Pass along any requests to our instance of express-pouchdb.
 *
 * @param that - The component itself.
 * @param req {Object} - The Express request object.
 * @param res {Object} - The Express response object.
 * @param next {Function} - The next piece of middleware in the chain.
 *
 */
gpii.pouch.express.middleware = function (that, req, res, next) {
    that.expressPouchdb(req, res, next);
};

/**
 *
 * Clean up the filesystem content in `options.dbPath`, completely removing all data.
 *
 * @param that
 * @returns {*}
 */
gpii.pouch.express.cleanup = function (that) {
    var promise = fluid.promise();
    promise.then(that.events.onCleanupComplete.fire);

    // We cannot simply call db.destroy() on all databases, because express-pouchdb creates a few database on its own
    // and gives us no way to clean those up.
    //
    // The surest approach is to completely remove the underlying directory.  However, express-pouchdb will have one
    // or more of those files open while it's running.
    //
    // Since express-pouchdb does not provide any means to kill itself, we tell it to use an alternate instance of pouch
    // that stores its content in memory.  That way we can remove the content from the "real" directory.
    // TODO: Review with Antranig.

    var tmpPouchDB = PouchDB.defaults({ db: memdown});
    that.expressPouchdb.setPouchDB(tmpPouchDB).then(function () {
        rimraf(that.options.dbPath, function (error) {
            if (error) {
                promise.reject(error);
            }
            else {
                promise.resolve(true);
            }
        });
    });

    return promise;
};

fluid.defaults("gpii.pouch.express.base", {
    gradeNames: ["fluid.component", "gpii.express.middleware"],
    method: "use", // We have to support all HTTP methods, as does our underlying router.
    path: "/",
    namespace: "pouch-express", // Namespace to allow other routers to put themselves in the chain before or after us.
    /*
     var expressPouchBasePath   = path.resolve(os.tmpdir(), "expressPouchdb");
     var expressPouchConfigPath = path.resolve(expressPouchBasePath, "config.json");
     var pouchLogPath           = path.resolve(expressPouchBasePath, "log.txt");

     */
    tmpDir:  os.tmpdir(),
    baseDir: "@expand:path.resolve({that}.options.tmpDir, {that}.id)",
    expressPouchConfigFilename: "config.json",
    expressPouchConfigPath:     "@expand:path.resolve({that}.options.tmpDir, {that}.options.expressPouchConfigFilename)",
    expressPouchLogFilename:    "log.txt",
    expressPouchConfig: {
        log: {
            file: "@expand:path.resolve({that}.options.tmpDir, {that}.options.expressPouchLogFilename)"
        }
    },
    events: {
        onStarted:         null,
        onCleanup:         null,
        onCleanupComplete: null
    },
    members: {
        databaseInstances: {} // The actual PouchDB databases
    },
    databases: {}, // The configuration we will use to create the required databases on startup.
    listeners: {
        "onCreate.initExpressPouchdb": {
            funcName: "gpii.pouch.express.initExpressPouchdb",
            args:     ["{that}"]
        },
        "onCreate.initDbs": {
            priority: "last",
            func:     "{that}.initDbs"
        },
        "onCleanup.cleanup": {
            func: "{that}.cleanup"
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.pouch.express.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // request, response, next
        },
        cleanup: {
            funcName: "fluid.notImplemented"
        },
        initDb: {
            funcName: "fluid.notImplemented"
        },
        initDbs: {
            funcName: "fluid.notImplemented"
        }
    }
});

/**
 *
 * Only initialize databases that do not already exist.  For filesystem-backed databases only.
 *
 * @param that - The component itself.
 * @param dbKey {String} - The name of the database we are creating
 * @param dbOptions {Object} - The configuration options for the individual database.
 * @returns {Promise} - A promise which will be resolved when this database has been initialized.
 *
 */
gpii.pouch.express.initOnlyOnce = function (that, dbKey, dbOptions) {
    var dbPath = path.resolve(that.options.dbPath, that.options.dbPrefix + dbKey);
    if (fs.existsSync(dbPath)) {
        fluid.log("Database '" + dbKey + "' found, it will not be created...");
    }
    else {
        return gpii.pouch.express.initDb(that, dbKey, dbOptions);
    }
};

fluid.defaults("gpii.pouch.express", {
    gradeNames: ["gpii.pouch.express.base"],
    dbPath:     "{that}.options.baseDir",
    dbPrefix:   "gpii-pouchdb-",
    // Options to use when creating individual databases.
    dbOptions: {
        auto_compaction: true,
        // The trailing slash and prefix are required to ensure that we end up with /path/to/dir/dbname instead of /path/to/dirdbname.
        prefix: "@expand:path.resolve({that}.options.dbPath, {that}.options.dbPrefix)"
    },
    invokers: {
        cleanup: {
            funcName: "gpii.pouch.express.cleanup",
            args:     ["{that}"]
        },
        initDb: {
            funcName: "gpii.pouch.express.initOnlyOnce",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        initDbs: {
            funcName: "gpii.pouch.express.initDbs",
            args:     ["{that}"]
        }
    }
});

fluid.registerNamespace("gpii.pouch.express.inMemory");
gpii.pouch.express.inMemory.initDbs = function (that) {
    function initWork() {
        delete PouchDB.isBeingCleaned;
        return gpii.pouch.express.initDbs(that);
    }

    if (PouchDB.isBeingCleaned) {
        return PouchDB.isBeingCleaned.then(initWork);
    }
    else {
        return initWork();
    }
};

/**
 *
 * Clean up all in-memory database content.
 *
 * @param that
 *
 */
gpii.pouch.express.inMemory.cleanup = function (that) {
    if (PouchDB.isBeingCleaned) {
        fluid.fail("Cannot clean up, a previous instance is still busy with its own cleanup...");
    }
    var promises = [];
    fluid.each(that.databaseInstances, function (db, key) {
        var promise = db.destroy()
            .then(function () {
                fluid.log("Destroyed database '" + key + "'...");
            })["catch"](function (error) {
                fluid.fail("Error destroying database:", error);
            });

        promises.push(promise);
        return promise;
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then(function ()  {
        memdown.clearGlobalStore(); // We cannot use the more aggressive `true` option here, as it breaks things.
        that.events.onCleanupComplete.fire();
    });

    PouchDB.isBeingCleaned = sequence;

    return sequence;
};

fluid.defaults("gpii.pouch.express.inMemory", {
    gradeNames: ["gpii.pouch.express.base"],
    // Options to use when creating individual databases.
    dbOptions: {
        prefix: "",
        db: memdown
    },
    invokers: {
        cleanup: {
            funcName: "gpii.pouch.express.inMemory.cleanup",
            args:     ["{that}"]
        },
        initDb: {
            funcName: "gpii.pouch.express.initDb",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        initDbs: {
            funcName: "gpii.pouch.express.inMemory.initDbs",
            args:     ["{that}"]
        }
    }
});
