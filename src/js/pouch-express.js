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

var os             = require("os");
var fs             = require("fs");
var rimraf         = require("rimraf");
var memdown        = require("memdown");

// Needs to exist for our expanders, not called directly in code.
var path           = require("path"); // eslint-disable-line

var expressPouchdb = require("express-pouchdb");

var PouchDB        = require("pouchdb");

// The cleanup cycle used by express-pouchdb leaves a shedload of listeners around.  To avoid these, we disable the
// event listener warnings, but only for PouchDB itself.
PouchDB.setMaxListeners(250);

/**
 * A static function to expand all variations on the definitions used in `options.databases`:
 *
 *   1. dbName: { data: "singlePath"} // One single file to be loaded, long notation.  No custom options.
 *   2. dbName: { data: ["path1", "path2"] } // Multiple files to be loaded, long notation, no custom options.
 *   3. dbName: { data: ["path1", "path2"], dbOptions: { db: memdown } } // Long notation, including additional custom database options.
 *   4. dbName: { dbOptions: { db: memdown} } // Long notation, no data, but with custom database options.
 *   5. dbName: {} // No data, no custom options.
 *
 * @param dbDef - The definition of a single database in any of the above formats.
 * @returns {Object} - An expanded record in Object form.
 *
 */
gpii.pouch.express.expandDbDef = function (dbDef) {
    var expandedDef = {};
    if (typeof dbDef === "object" && dbDef !== null && dbDef !== undefined) {
        expandedDef = dbDef;
        if (expandedDef.data) {
            expandedDef.data = fluid.makeArray(expandedDef.data);
        }
    }

    return expandedDef;
};


/**
 *
 * Initialize our instance of express-pouchdb.
 *
 * @param that
 * @returns {Object} - The expressPouchDB middleware.
 *
 */
gpii.pouch.express.initExpressPouchdb = function (that) {
    fluid.log("express pouchdb instance '", that.id, "' initalizing...");

    // Create our base directory if it doesn't already exist.
    if (that.options.baseDir && !fs.existsSync(that.options.baseDir)) {
        fluid.log("Creating directory '", that.options.baseDir, "' for express pouchdb instance '", that.id, "'...");
        fs.mkdirSync(that.options.baseDir);
    }

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
    // We create our components programatically because we need:
    //
    //   1. To be notified when all databases are ready for use.  We do this with a `fluid.promise.sequence`.
    //   2. A way to clean up each database later on.  We do this by retaining a list of database instances.
    //   3. A way to know when all of them have been destroyed.  We do this with another `sequence` in our cleanup invoker (see below).
    //
    // I can think of ways to accomplish #2 with dynamic components, but not 1 and 3.
    // TODO: Review with Antranig.

    var promises = [];
    fluid.each(that.options.databases, function (dbOptions, dbKey) {
        promises.push(gpii.pouch.express.initDb(that, dbKey, dbOptions));
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
 * @param that - The component itself
 * @param dbKey {String} - The database name.
 * @param dbDef {Object} - Our convention for representing multiple databases.  See the docs for examples.
 * @returns {Promise} A promise that will be resolved with the database is initialized.
 */
gpii.pouch.express.initDb = function (that, dbKey, dbDef) {
    var expandedDef = gpii.pouch.express.expandDbDef(dbDef);
    var initPromise = fluid.promise();
    var dbOptions = expandedDef.dbOptions ? fluid.merge(that.options.dbOptions, expandedDef.dbOptions) : fluid.copy(that.options.dbOptions);
    dbOptions.name = dbKey;
    var dbComponentOptions = {
        type: "fluid.component",
        gradeNames: that.options.pouchGradeNames,
        dbOptions: dbOptions,
        baseDir: that.options.baseDir,
        listeners: {
            "onDataLoaded.resolvePromise": {
                func: initPromise.resolve
            }
        }
    };
    if (expandedDef.data) {
        dbComponentOptions.dbPaths = expandedDef.data;
    }

    var dbComponent = fluid.construct("gpii_pouch_" + that.id + "_" + dbKey, dbComponentOptions);
    that.databaseInstances[dbKey] = dbComponent;

    return initPromise;
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
    // fluid.log("express pouchdb instance '", that.id, "' responding...")
    that.expressPouchdb(req, res, next);
};

/**
 *
 * Clean up any instance of `gpii.pouchdb` that we're aware of.  Then, to get rid of databases created by
 * express-pouchdb, complete remove all data in `options.baseDir`.
 *
 * @param that - The component itself.
 * @returns {Promise} - A promise that will be resolved when cleanup is complete.
 *
 */
gpii.pouch.express.cleanup = function (that) {
    // fluid.log("express pouchdb instance '", that.id, "' cleaning up...");
    var promises = [];

    fluid.each(that.databaseInstances, function (databaseInstance) {
        promises.push(databaseInstance.destroyPouch());
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then(function () {
        // We cannot simply call db.destroy() on all databases, because express-pouchdb creates a few databases on its own
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
            rimraf(that.options.baseDir, function (error) {
                if (error) {
                    fluid.fail(error);
                }
                else {
                    that.events.onCleanupComplete.fire()
                }
            });
        });
    });

    return sequence;
};

fluid.defaults("gpii.pouch.express.base", {
    gradeNames: ["fluid.component", "gpii.express.middleware"],
    method: "use", // We have to support all HTTP methods, as does our underlying router.
    path: "/",
    namespace: "pouch-express", // Namespace to allow other routers to put themselves in the chain before or after us.
    tmpDir:  os.tmpdir(),
    baseDir: "@expand:path.resolve({that}.options.tmpDir, {that}.id)",
    expressPouchConfigFilename: "config.json",
    expressPouchConfigPath:     "@expand:path.resolve({that}.options.baseDir, {that}.options.expressPouchConfigFilename)",
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
    pouchGradeNames: ["gpii.pouch.node.base"],
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
        },
        "onCreate.log": {
            funcName: "fluid.log",
            args: ["express baseDir: '", "{that}.options.baseDir", "'..."]
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.pouch.express.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // request, response, next
        }
    }
});

fluid.defaults("gpii.pouch.express", {
    gradeNames: ["gpii.pouch.express.base"],
    pouchGradeNames: ["gpii.pouch.node"],
    dbOptions: {
        prefix: "@expand:gpii.pouch.node.makeSafePrefix({that}.options.baseDir)"
    },
    invokers: {
        cleanup: {
            funcName: "gpii.pouch.express.cleanup",
            args:     ["{that}"]
        },
        initDbs: {
            funcName: "gpii.pouch.express.initDbs",
            args:     ["{that}"]
        }
    }
});
