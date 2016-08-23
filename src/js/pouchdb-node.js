/*

    A node-specific extension of gpii.pouch that adds additional abilities, such as loading data from package-specific
    paths.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var fs   = require("fs");
var os   = require("os");
var path = require("path");
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

    if (fs.existsSync(that.options.baseDir)) {
        if (fs.existsSync(fullPath)) {
            that.hasExistingDataDir = true;
        }
        else {
            that.hasExistingDataDir = false;
            fs.mkdirSync(fullPath);
        }
    }
    else {
        that.hasExistingDataDir = false;
        fs.mkdirSync(that.options.baseDir);
    }
};

gpii.pouch.node.makeSafePrefix = function (toResolve) {
    return fluid.module.resolvePath(toResolve) + path.sep;
};

/**
 *
 * Expand a single database definition to handle various "short" and "long" formats, including:
 *
 *   1. "singlePath" // One single file to be loaded.
 *   2. ["path1", "path2"] // Multiple files to be loaded.
 *   3. undefined // No data.
 *
 * @param dbPath - A `String` or `Array` representing one or more files to load (see above for the supported variations).
 * @returns {Array} An array of database paths.
 *
 */
gpii.pouch.node.expandPath = function (dbPath) {
    if (Array.isArray(dbPath)) {
        return dbPath;
    }
    else if (typeof dbPath === "string") {
        return [dbPath];
    }

    // If we were passed something odd, like undefined or null, return an empty array.
    return [];
};

/**
 *
 * Load data from one or more package-relative paths..
 *
 * @param that - The component itself.
 * @param dbPath - A string or array representing data to be loaded.
 * @returns {Promise} - A promise which will be resolved when all data has been loaded.
 *
 */
gpii.pouch.node.loadDataFromPath = function (that, dbPath) {
    var promises = [];

    var expandedPaths = gpii.pouch.node.expandPath(dbPath);
    fluid.each(expandedPaths, function (dbPath) {
        if (dbPath) {
            var data = fluid.require(dbPath);
            var bulkDocsPromise = that.bulkDocs(data);
            promises.push(bulkDocsPromise);
        }
    });

    // An sequence with an empty array of promises will automatically be resolved, so we can safely use this construct.
    var sequence = fluid.promise.sequence(promises);
    sequence.then( function () {
        that.events.onDataLoaded.fire(that);
    });
    return sequence;
};


/**
 *
 * Only load data on startup if the database doesn't already exist.
 *
 * @param that - The component itself.
 *
 */
gpii.pouch.node.loadDataIfNeeded = function (that) {
    if (that.hasExistingDataDir) {
        fluid.log("The data directory for this database already exists, no data will be loaded...");
        that.events.onDataLoaded.fire(that);
    }
    else {
        that.loadData(that.options.dbPaths);
    }
};

fluid.defaults("gpii.pouch.node.base", {
    gradeNames: ["gpii.pouch"],
    tmpDir:     os.tmpdir(),
    baseDir:    "@expand:path.resolve({that}.options.tmpDir, {that}.id)",
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
