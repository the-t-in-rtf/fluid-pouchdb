// Tests for our "timely rimraf" static function
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var fs     = require("fs");
var mock   = require("mock-fs");
var jqUnit = require("node-jqunit");

fluid.require("%gpii-pouchdb");

fluid.registerNamespace("gpii.tests.timelyRimraf");

gpii.tests.timelyRimraf.cleanup = function () {
    mock.restore();
};

jqUnit.module("Testing 'timely rimraf' wrapper function...");

jqUnit.test("Mocks should mock...", function () {
    mock({
        targetFile: "All good things come to an end."
    });

    jqUnit.assertTrue("The mock file should exist...", fs.existsSync("targetFile"));

    gpii.tests.timelyRimraf.cleanup();
});

jqUnit.asyncTest("Successful calls should succeed...", function () {
    mock({
        targetFile: "All good things come to an end."
    });

    var promise = gpii.pouchdb.timelyRimraf("targetFile");

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.assert("We should have been able to remove a simulated file...");

            jqUnit.assertFalse("The file should no longer exist...", fs.existsSync("targetFile"));
            gpii.tests.timelyRimraf.cleanup();
        },
        function (error) {
            jqUnit.start();
            jqUnit.fail(error);
            gpii.tests.timelyRimraf.cleanup();
        }
    );
});

jqUnit.asyncTest("Failing calls should fail...", function () {
    mock({ target: "must exist so that our custom unlink function is called..."});

    var promise = gpii.pouchdb.timelyRimraf("target", { unlink: function (file, cb) { cb("Fail!"); }});

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.fail("No error was thrown...");

            gpii.tests.timelyRimraf.cleanup();
        },
        function () {
            jqUnit.start();
            jqUnit.assert("An error was received, as expected...");
            gpii.tests.timelyRimraf.cleanup();
        }
    );
});

jqUnit.asyncTest("Long running calls should time out...", function () {
    mock({ target: "must exist..."});

    var promise = gpii.pouchdb.timelyRimraf("target", { unlink: function (file, cb) { setTimeout(cb, 150); }}, 50);

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.fail("No error was thrown...");

            gpii.tests.timelyRimraf.cleanup();
        },
        function (error) {
            jqUnit.start();
            jqUnit.assertTrue("We should have received a timeout...", error.indexOf("Rimraf failed to complete") !== -1);
            gpii.tests.timelyRimraf.cleanup();
        }
    );
});
