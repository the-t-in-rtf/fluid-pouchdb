/*

    Tests for the static functions used in `gpii.pouch.node`.

 */
/* eslint-env node */
"use strict";
var fluid =  require("infusion");
var jqUnit = require("node-jqunit");
var gpii   = fluid.registerNamespace("gpii");

require("../../../");

fluid.registerNamespace("gpii.tests.pouchdb.node");

gpii.tests.pouchdb.node.testDbPathExpansion = function (testDef) {
    jqUnit.test(testDef.name, function () {
        jqUnit.assertDeepEq("The output should be as expected...", testDef.expected, gpii.pouch.node.expandPath(testDef.input));
    });
};

fluid.defaults("gpii.tests.pouchdb.node", {
    gradeNames: ["fluid.component"],
    dbPathExpansionTests: {
        singleString: {
            name:     "A single database path should be expanded correctly...",
            input:    "/tmp/foo",
            expected: ["/tmp/foo"]
        },
        array: {
            name:     "An array of database paths should be expanded correctly...",
            input:    ["/tmp/foo", "/tmp/bar"],
            expected: ["/tmp/foo", "/tmp/bar"]
        },
        undefined: {
            name:     "An object with a single database path should be expanded correctly...",
            input:    undefined,
            expected: []
        },
        null: {
            name:     "A null value should be expanded correctly...",
            input:    null,
            expected: []
        },
        object: {
            name:     "An object should be expanded correctly...",
            input:    {},
            expected: []
        }
    },
    listeners: {
        "onCreate.announceModule": {
            funcName: "jqUnit.module",
            args:     ["Testing static functions used in `gpii.pouch.node`..."]
        },
        "onCreate.runDbPathExpansionTests": {
            priority: "after:announceModule",
            funcName: "fluid.each",
            args:     ["{that}.options.dbPathExpansionTests", gpii.tests.pouchdb.node.testDbPathExpansion]
        }
    }
});

gpii.tests.pouchdb.node();
