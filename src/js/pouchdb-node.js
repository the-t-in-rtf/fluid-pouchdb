/*

    A node-specific extension of gpii.pouch that adds additional abilities, such as loading data from package-specific
    paths.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var fs     = require("fs");
var os     = require("os");
var path   = require("path");

require("../../");

fluid.registerNamespace("gpii.pouch.node");

/**
 *
 * Create our working directory if it doesn't already exist.
 *
 * @param that - The component itself.
 *
 */
gpii.pouch.node.initDir = function (that) {
    var fullPath = path.resolve(that.options.baseDir, that.options.dbOptions.name);

    if (!fs.existsSync(that.options.baseDir)) {
        fs.mkdirSync(that.options.baseDir);
        that.baseDirBelongsToUs = true;
    }

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
    }
};

/**
 *
 * Create a "safe" prefix (i. e. db and directory name) for our content.
 *
 * @param toResolve An IoC reference to resolve.
 * @return {String} The resolved path followed by the path separator.
 *
 */
gpii.pouch.node.makeSafePrefix = function (toResolve) {
    return fluid.module.resolvePath(toResolve) + path.sep;
};

/**
 *
 * If we created our enclosing base directory, clean it up.
 *
 * @param that - The component itself.
 */
gpii.pouch.node.cleanup = function (that) {
    var togo = fluid.promise();
    togo.then(that.events.onCleanupComplete.fire);

    if (that.baseDirBelongsToUs) {
        var cleanupPromise = gpii.pouchdb.timelyRimraf(that.options.baseDir, {}, that.options.rimrafTimeout);
        cleanupPromise.then(togo.resolve, function (error) {
            fluid.log("Error cleaning up basedir:", error);
            togo.resolve();
        });
    }
    else {
        togo.resolve();
    }

    return togo;
};


/**
 *
 * Load data from one or more package-relative paths..
 *
 * @param that - The component itself.
 * @param dbPaths - A string or array representing data to be loaded.
 * @return {Promise} - A promise which will be resolved when all data has been loaded.
 *
 */
gpii.pouch.node.loadDataFromPath = function (that, dbPaths) {
    var promises = [];

    // This instance may not actually have any data, but it should still incidate that it has finished (not) loading data.
    if (dbPaths !== undefined) {
        fluid.each(fluid.makeArray(dbPaths), function (singleDbPath) {
            var data = fluid.require(singleDbPath);
            var bulkDocsPromise = that.bulkDocs(data);
            promises.push(bulkDocsPromise);
        });
    }

    // An sequence with an empty array of promises will automatically be resolved, so we can safely use this construct.
    var sequence = fluid.promise.sequence(promises);
    sequence.then( function () {
        that.events.onDataLoaded.fire(that);
    });
    return sequence;
};


/**
 *
 * Only load data on startup if the database doesn't already have data.
 *
 * @param that - The component itself.
 *
 */
gpii.pouch.node.loadDataIfNeeded = function (that) {
    // As this is a bit of internal housekeeping, call "info" directly to avoid firing an `onInfoComplete` function.
    that.pouchDb.info(function (err, result) {
        if (err) {
            fluid.fail(err);
        }
        else {
            if (result.doc_count) {
                fluid.log("This database already has one or more records, no data will be loaded...");
                that.events.onDataLoaded.fire(that);
            }
            else {
                that.loadData(that.options.dbPaths);
            }
        }
    });
};

/**
 *
 * Our pouch destruction needs to account for the directory removal before resolving its promise.
 *
 * @param that
 * @param fnArgs
 * @return {*}
 */
gpii.pouch.node.destroyPouch = function (that, fnArgs) {
    var togo = fluid.promise();

    var dbDestroyPromise = gpii.pouch.callPouchFunction(that, "destroy", fnArgs, "onPouchDestroyComplete");

    dbDestroyPromise.then(function () {
        var dirCleanupPromise = gpii.pouch.node.cleanup(that);
        dirCleanupPromise.then(togo.resolve, togo.reject);
    }, togo.reject);

    return togo;
};

fluid.defaults("gpii.pouch.node.base", {
    gradeNames: ["gpii.pouch"],
    tmpDir:     os.tmpdir(),
    baseDir:    "@expand:path.resolve({that}.options.tmpDir, {that}.id)",
    removeDirOnCleanup: true,
    rimrafTimeout: 1000,
    // Options to use when creating individual databases.
    members: {
        baseDirBelongsToUs: false
    },
    dbOptions: {
        auto_compaction: true,
        skip_setup: false,
        // The trailing slash and prefix are required to ensure that we end up with /path/to/dir/dbname instead of /path/to/dirdbname.
        prefix: "@expand:gpii.pouch.node.makeSafePrefix({that}.options.baseDir)"
    },
    events: {
        onDataLoaded:null,
        onReady:     null
    },
    invokers: {
        destroyPouch: {
            funcName: "gpii.pouch.node.destroyPouch",
            args:     ["{that}", "{arguments}"] // fnName, fnArgs, eventName
        },
        loadData: {
            funcName: "gpii.pouch.node.loadDataFromPath",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    listeners: {
        "onCreate.initDir": {
            priority: "before:initPouch",
            funcName: "gpii.pouch.node.initDir",
            args:     ["{that}"]
        },
        "onDataLoaded.log": {
            funcName: "fluid.log",
            args:     ["Data loaded for database '", "{that}.options.dbOptions.name", "'..."]
        }
    }
});


fluid.defaults("gpii.pouch.node", {
    gradeNames: ["gpii.pouch.node.base"],
    listeners: {
        "onCreate.loadDataIfNeeded": {
            priority: "after:initPouch",
            funcName: "gpii.pouch.node.loadDataIfNeeded",
            args:     ["{that}"]
        },
        "onError.log": {
            funcName: "fluid.log",
            args: ["pouch component error:", "{arguments}.0.message"]
        }
    }
});
