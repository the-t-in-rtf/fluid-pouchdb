/*

    A synchronous alternative to rimraf for use in cleaning up temporary content after runs.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var fs = require("fs");
var path = require("path");
var process = require("process");

fluid.registerNamespace("gpii.pouch");

/**
 *
 * A low-level approach to removing a directory, used to bypass issues in Windows with rimraf and other comparable solutions.
 *
 * Adapted from: https://github.com/fluid-project/kettle/blob/master/lib/test/KettleTestUtils.js#L47
 *
 * @param {String} pathToDelete - The full path to remove.
 *
 */
gpii.pouch.deleteFolderRecursive = function (pathToDelete) {
    if (fs.existsSync(pathToDelete)) {
        fs.readdirSync(pathToDelete).forEach(function (file) {
            var curPath = path.resolve(pathToDelete, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                gpii.pouch.deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(pathToDelete);
    }
};

/**
 *
 * Crudely inspect the arguments to ensure that the user isn't trying to get help using an argument like `--help`.
 *
 * @param {Array<String>} argsToScan - The array of arguments to scan.
 * @return {Boolean} - `true` if a "help" pattern is found, `false` otherwise.
 *
 */
gpii.pouch.deleteFolderRecursive.askingForHelp = function (argsToScan) {
    var helpishPattern = /^(--?|\\)(help|h|\?)/;

    var hasHelpishPattern = false;

    argsToScan.forEach(function (argToScan) {
        if (!hasHelpishPattern && argToScan.match(helpishPattern)) {
            hasHelpishPattern = true;
        }
    });

    return hasHelpishPattern;
};


/**
 *
 * A wrapper to allow the bin/delete-folder.js script in this package to be called from the command line.
 *
 */
gpii.pouch.deleteFolderRecursive.runAsCommand = function () {
    var relevantArgs = process.argv.slice(2);
    if (relevantArgs.length === 0 || gpii.pouch.deleteFolderRecursive.askingForHelp(relevantArgs)) {
        fluid.log("Usage: node <path>/bin/delete-folder.js pathToRemove1 pathToRemove2 ...");
    }
    else {
        fluid.each(relevantArgs, gpii.pouch.deleteFolderRecursive);
    }
};
