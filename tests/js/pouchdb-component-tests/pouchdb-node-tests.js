/*

    Run the common tests with the node component type.  Also test unique functionality of this grade.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("./pouchdb-component-common-tests");

fluid.defaults("fluid.tests.pouchdb.component.node.caseHolder", {
    gradeNames: ["fluid.tests.pouchdb.component.common.caseHolder.base"],
    // Destroy the database after each test.
    sequenceEnd:   [
        {
            func: "{testEnvironment}.pouchDb.destroyPouch"
        },
        {
            event:    "{testEnvironment}.pouchDb.events.onCleanupComplete",
            listener: "jqUnit.assert",
            args:     ["The database should be destroyed and cleaned up on test completion..."]
        }
    ],
    rawModules: [{
        name: "Data-loading tests for the `fluid.pouch.node` component...",
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
                name: "Test loadData with a single value...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.loadData",
                        args: ["%fluid-pouchdb/tests/data/rgb.json"]
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
                        args: [["%fluid-pouchdb/tests/data/rgb.json", "%fluid-pouchdb/tests/data/supplemental.json"]]
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

fluid.defaults("fluid.tests.pouchdb.component.node.loadDataOnStartup.caseHolder", {
    gradeNames: ["fluid.tests.pouchdb.component.common.caseHolder.base"],
    rawModules: [{
        name: "Test data loading on startup for the `fluid.pouch.node` component...",
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


fluid.defaults("fluid.tests.pouchdb.component.node.common.environment", {
    gradeNames: ["fluid.tests.pouchdb.component.common.environment"],
    components: {
        pouchDb: {
            type: "fluid.pouch.node.base"
        }
    }
});

fluid.defaults("fluid.tests.pouchdb.component.node.environment", {
    gradeNames: ["fluid.tests.pouchdb.component.node.common.environment"],
    components: {
        caseHolder: {
            type: "fluid.tests.pouchdb.component.node.caseHolder"
        }
    }
});

fluid.defaults("fluid.tests.pouchdb.component.node.loadDataOnStartup.environment", {
    gradeNames: ["fluid.tests.pouchdb.component.node.common.environment"],
    components: {
        pouchDb: {
            type: "fluid.pouch.node",
            options: {
                dbPaths: ["%fluid-pouchdb/tests/data/data.json"]
            }
        },
        caseHolder: {
            type: "fluid.tests.pouchdb.component.node.loadDataOnStartup.caseHolder"
        }
    }
});

fluid.test.runTests("fluid.tests.pouchdb.component.node.common.environment");
fluid.test.runTests("fluid.tests.pouchdb.component.node.environment");
fluid.test.runTests("fluid.tests.pouchdb.component.node.loadDataOnStartup.environment");
