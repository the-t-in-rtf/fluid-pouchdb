/*
    A static function to improve the performance when making repeated asynchronous rimraf calls.

    See https://issues.gpii.net/browse/GPII-2392 for details.
*/
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var rimraf = require("rimraf");

// If an FS implementation is passed in to rimraf, it will be used instead of node's fs module.  We use graceful-fs
// to try to avoid various "busy" errors.
// See https://github.com/isaacs/rimraf#options
var fs     = require("graceful-fs");

fluid.registerNamespace("gpii.pouchdb");

/**
 *
 * A function that binds a call to rimraf(path, options, callback) to a fluid.promise, and which ensures that
 * it completes in a more timely fashion than rimraf itself can manage.
 *
 * @param pathToRemove {String} - The path (package-relative, relative, or full) to a file or directory to be removed.
 * @param rimrafOptions {Object} - An optional set of options to pass to rimraf.  See https://github.com/isaacs/rimraf#options
 * @param timeoutMs {Number} - If set, the number of milliseconds to wait for the asynchronous remove to complete before rejecting it.
 *
 */
gpii.pouchdb.timelyRimraf = function (pathToRemove, rimrafOptions, timeoutMs) {
    var promise = fluid.promise();
    if (timeoutMs) {
        setTimeout(function () {
            if (!promise.disposition) {
                promise.reject("Rimraf failed to complete within " + timeoutMs + "...");
            }
        }, timeoutMs);
    }

    var combinedOptions = rimrafOptions ? fluid.extend({}, fs, rimrafOptions) : fs;

    rimraf(pathToRemove, combinedOptions, function (error) {
        if (!promise.disposition) {
            if (error) {
                promise.reject(error);
            }
            else {
                promise.resolve();
            }
        }
    });

    return promise;
};
