/*

    A node-specific extension of gpii.pouch that adds additional abilities, such as loading data from package-specific
    paths.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../");

fluid.registerNamespace("gpii.pouch.node");

/**
 *
 * Load data from one or more package-relative paths..
 *
 * @param that - The component itself.
 * @returns {Promise} - A promise which will be resolved when all data has been loaded.
 *
 */
gpii.pouch.node.loadDataFromPath = function (that, paths) {
    var promises = [];

    fluid.each(fluid.makeArray(paths), function (dbPath) {
        var data = fluid.require(dbPath);
        var bulkDocsPromise = that.bulkDocs(data);
        promises.push(bulkDocsPromise);
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then( function () {
        that.events.onDataLoaded.fire(that);
    });
    return sequence;
};

fluid.defaults("gpii.pouch.node.base", {
    gradeNames: ["gpii.pouch"],
    events: {
        onDataLoaded:null,
        onReady:     null
    },
    invokers: {
        loadData: {
            funcName: "gpii.pouch.node.loadDataFromPath",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});


fluid.defaults("gpii.pouch.node", {
    gradeNames: ["gpii.pouch.node.base"],
    listeners: {
        "onCreate.loadData": {
            func: "{that}.loadData",
            args: ["{that}.options.dbPaths"]
        }
    }
});
