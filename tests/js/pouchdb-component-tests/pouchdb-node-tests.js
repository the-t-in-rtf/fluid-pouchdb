/*

    Run the common tests with the node component type.  Also test unique functionality of this grade.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("./pouchdb-component-common-tests");

fluid.defaults("gpii.tests.pouchdb.component.node.caseHolder", {
    gradeNames: ["gpii.tests.pouchdb.component.common.caseHolder.base"],
    rawModules: [{
        name: "Data-loading tests for the `gpii.pouch.node` component...",
        type: "test",
        tests: [
            {
                name: "Confirm that the `onDataLoaded` event is fired if the data option is undefined...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.loadData",
                        args: []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onDataLoaded",
                        listener: "jqUnit.assert",
                        args:    ["onDataLoaded should be fired even if the data option is undefined..."]
                    }
                ]
            },
            {
                name: "Confirm that the `onDataLoaded` event is fired if we pass an empty object...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.loadData",
                        args: [{}]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onDataLoaded",
                        listener: "jqUnit.assert",
                        args:    ["onDataLoaded should be fired even if we pass an empty object..."]
                    }
                ]
            },
            {
                name: "Test loadData with a single value...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.loadData",
                        args: ["%gpii-pouchdb/tests/data/rgb.json"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onDataLoaded",
                        listener: "{testEnvironment}.pouchDb.info",
                        args:     []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onInfoComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The database should have been loaded correctly...", { db_name: "test", doc_count: 4}, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test loadData with an array...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.loadData",
                        args: [["%gpii-pouchdb/tests/data/rgb.json", "%gpii-pouchdb/tests/data/supplemental.json"]]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onDataLoaded",
                        listener: "{testEnvironment}.pouchDb.info",
                        args:     []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onInfoComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The contents of both data files should have been loaded...", { db_name: "test", doc_count: 5}, "{arguments}.0"]
                    }
                ]
            }
        ]
    }]
});

fluid.defaults("gpii.tests.pouchdb.component.node.loadDataOnStartup.caseHolder", {
    gradeNames: ["gpii.tests.pouchdb.component.common.caseHolder.base"],
    rawModules: [{
        name: "Test data loading on startup for the `gpii.pouch.node` component...",
        type: "test",
        tests: [
            {
                name: "Confirm that data is loaded on startup...",
                sequence: [
                    /*
                        I know the component will already exist, but if I don't have this next step, I get errors like:

                        Message: Assertion failure (see console.log for expanded message): Error resolving path segment
                        "pouchDb" of path pouchDb.events.onDataLoaded since component with record ,[object Object], has
                        annotation "createOnEvent" - this very likely represents an implementation error.

                        TODO:  Discuss with Antranig.

                     */
                    {
                        func: "fluid.identity"
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onDataLoaded",
                        listener: "{testEnvironment}.pouchDb.info",
                        args:    []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onInfoComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The database should have been loaded correctly...", { db_name: "test", doc_count: 3}, "{arguments}.0"]
                    }
                ]
            }
        ]
    }]
});


fluid.defaults("gpii.tests.pouchdb.component.node.common.environment", {
    gradeNames: ["gpii.tests.pouchdb.component.common.environment"],
    components: {
        pouchDb: {
            type: "gpii.pouch.node.base"
        }
    }
});

fluid.defaults("gpii.tests.pouchdb.component.node.environment", {
    gradeNames: ["gpii.tests.pouchdb.component.node.common.environment"],
    components: {
        caseHolder: {
            type: "gpii.tests.pouchdb.component.node.caseHolder"
        }
    }
});

fluid.defaults("gpii.tests.pouchdb.component.node.loadDataOnStartup.environment", {
    gradeNames: ["gpii.tests.pouchdb.component.node.common.environment"],
    components: {
        pouchDb: {
            type: "gpii.pouch.node",
            options: {
                dbPaths: ["%gpii-pouchdb/tests/data/data.json"]
            }
        },
        caseHolder: {
            type: "gpii.tests.pouchdb.component.node.loadDataOnStartup.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.pouchdb.component.node.common.environment");
fluid.test.runTests("gpii.tests.pouchdb.component.node.environment");
fluid.test.runTests("gpii.tests.pouchdb.component.node.loadDataOnStartup.environment");
