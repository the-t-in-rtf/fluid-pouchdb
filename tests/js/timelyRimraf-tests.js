// Tests for our "timely rimraf" static function
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var fs     = require("fs");
var mock   = require("mock-fs");
var jqUnit = require("node-jqunit");

// TODO: These fail to complete and block other tests from running at the moment.

fluid.require("%fluid-pouchdb");

fluid.registerNamespace("fluid.tests.timelyRimraf");

fluid.tests.timelyRimraf.cleanup = function () {
    mock.restore();
};

jqUnit.module("Testing 'timely rimraf' wrapper function...");

jqUnit.test("Mocks should mock...", function () {
    mock({
        targetFile: "All good things come to an end."
    });

    jqUnit.assertTrue("The mock file should exist...", fs.existsSync("targetFile"));

    fluid.tests.timelyRimraf.cleanup();
});

jqUnit.test("Successful calls should succeed...", function () {
    mock({
        targetFile: "All good things come to an end."
    });

    jqUnit.stop();

    var promise = fluid.pouchdb.timelyRimraf("targetFile");

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.assert("We should have been able to remove a simulated file...");

            jqUnit.assertFalse("The file should no longer exist...", fs.existsSync("targetFile"));
            fluid.tests.timelyRimraf.cleanup();
        },
        function (error) {
            jqUnit.start();
            jqUnit.fail(error);
            fluid.tests.timelyRimraf.cleanup();
        }
    );
});

jqUnit.test("Failing calls should fail...", function () {
    mock({ target: "must exist so that our custom unlink function is called..."});

    jqUnit.stop();

    var promise = fluid.pouchdb.timelyRimraf("target", { unlink: function (file, cb) { cb("Fail!"); }});

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.fail("No error was thrown...");

            fluid.tests.timelyRimraf.cleanup();
        },
        function () {
            jqUnit.start();
            jqUnit.assert("An error was received, as expected...");
            fluid.tests.timelyRimraf.cleanup();
        }
    );
});

jqUnit.test("Long running calls should time out...", function () {
    mock({ target: "must exist..."});

    jqUnit.stop();

    var promise = fluid.pouchdb.timelyRimraf("target", { unlink: function (file, cb) { setTimeout(cb, 150); }}, 50);

    promise.then(
        function () {
            jqUnit.start();
            jqUnit.fail("No error was thrown...");

            fluid.tests.timelyRimraf.cleanup();
        },
        function (error) {
            jqUnit.start();
            jqUnit.assertTrue("We should have received a timeout...", error.indexOf("Rimraf failed to complete") !== -1);
            fluid.tests.timelyRimraf.cleanup();
        }
    );
});
