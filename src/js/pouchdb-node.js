/*

    A node-specific extension of gpii.pouch that adds additional abilities, such as loading data from package-specific
    paths.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var os     = require("os");
var path   = require("path");

var rimraf = require("rimraf");
var mkdirp = require("mkdirp");

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

    // fluid.log("pouch component '" , that.id, "' saving data to '", fullPath, "'...");

    // Right now we have to keep this synchronous so that the ordered group of "onCreate" listeners is executed correctly.
    // TODO: Update this to use whatever we end up calling "chained" promises.
    mkdirp.sync(fullPath);
};

gpii.pouch.node.makeSafePrefix = function (toResolve) {
    return fluid.module.resolvePath(toResolve) + path.sep;
};

/**
 *
 * Load data from one or more package-relative paths..
 *
 * @param that - The component itself.
 * @param dbPaths - A string or array representing data to be loaded.
 * @returns {Promise} - A promise which will be resolved when all data has been loaded.
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
 * Remove all content, close, and then remove the directory content for this database.
 *
 * @param that
 * @param callback
 * @returns {*}
 */
gpii.pouch.node.cleanPouch = function (that, callback) {
    var promise = fluid.promise();
    gpii.pouch.cleanPouch(that, function (cleanupMessage) {
        if (!cleanupMessage.ok) {
            promise.reject(cleanupMessage);
        }
        else {
            that.close().then(function (closeError) {
                if (closeError) {
                    promise.reject(closeError);
                }
                else {
                    if (that.options.removeDirOnCleanup) {
                        rimraf(path.resolve(that.options.dbOptions.prefix, that.pouchDb.name), function (rmDirError) {
                            if (rmDirError) {
                                promise.reject(rmDirError);
                            }
                            else {
                                // Remove our cached views data as well.
                                var viewDirs = path.resolve(that.options.dbOptions.prefix, that.pouchDb.name + "-mrview-*");
                                rimraf(viewDirs, function (rmViewDirError) {
                                    if (rmViewDirError) {
                                        promise.reject(rmViewDirError);
                                    }
                                    else {
                                        promise.resolve({ ok: true, message: that.options.messages.databaseCleaned });
                                    }
                                })
                            }
                        });
                    }
                    else {
                        promise.resolve({ ok: true, message: that.options.messages.databaseCleaned });
                    }
                }
            });
        }
    });

    promise.then(callback);
    return promise;
};

fluid.defaults("gpii.pouch.node.base", {
    gradeNames: ["gpii.pouch"],
    tmpDir:     os.tmpdir(),
    baseDir:    "@expand:path.resolve({that}.options.tmpDir, {that}.id)",
    removeDirOnCleanup: true,
    // Options to use when creating individual databases.
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
        cleanPouch: {
            funcName: "gpii.pouch.node.cleanPouch",
            args:     ["{that}", "{that}.events.onCleanupComplete.fire"] // callback
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
