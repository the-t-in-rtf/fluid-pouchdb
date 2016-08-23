/*

 Tests for the static functions used in `gpii.pouch.express`.

 */
/* eslint-env node */
"use strict";
var fluid =  require("infusion");
var jqUnit = require("node-jqunit");
var gpii   = fluid.registerNamespace("gpii");

require("../../../");

fluid.registerNamespace("gpii.tests.pouchdb.express");

gpii.tests.pouchdb.express.testDbDefExpansion = function (testDef) {
    jqUnit.test(testDef.name, function () {
        jqUnit.assertDeepEq("The output should be as expected...", testDef.expected, gpii.pouch.express.expandDbDef(testDef.input));
    });
};

fluid.defaults("gpii.tests.pouchdb.express", {
    gradeNames: ["fluid.component"],
    dbDefExpansionTests: {
        objectSinglePath: {
            name:     "An object with a single path should be expanded correctly...",
            input:    { data: "/tmp/foo"},
            expected: { data: ["/tmp/foo"]}
        },
        objectMultiplePaths: {
            name:     "An object with an array of paths should be expanded correctly...",
            input:    { data: ["/tmp/foo", "/tmp/bar"]},
            expected: { data: ["/tmp/foo", "/tmp/bar"]}
        },
        objectWithDataAndCustomOptions: {
            name:     "An object with data and custom options should be expanded correctly...",
            input:    { data: "/tmp/foo", custom: true},
            expected: { data: ["/tmp/foo"], custom: true}
        },
        objectWithOnlyCustomOptions: {
            name:     "An object with data and custom options should be expanded correctly...",
            input:    { custom: true },
            expected: { custom: true }
        },
        emptyObject: {
            name:     "An object with data and custom options should be expanded correctly...",
            input:    {},
            expected: {}
        },
        undefined: {
            name:     "An undefined value should be expanded correctly...",
            input:    undefined,
            expected: {}
        },
        null: {
            name:     "A null value should be expanded correctly...",
            input:    null,
            expected: {}
        },
        true: {
            name:     "A boolean `true` should be expanded correctly...",
            input:    true,
            expected: {}
        },
        false: {
            name:     "A boolean `false` should be expanded correctly...",
            input:    false,
            expected: {}
        }
    },
    listeners: {
        "onCreate.announceModule": {
            funcName: "jqUnit.module",
            args:     ["Testing static functions used in `gpii.pouch.express`..."]
        },
        "onCreate.runDbDefExpansionTests": {
            priority: "after:announceModule",
            funcName: "fluid.each",
            args:     ["{that}.options.dbDefExpansionTests", gpii.tests.pouchdb.express.testDbDefExpansion]
        }
    }
});

gpii.tests.pouchdb.express();
