// Browser and Node shared fixtures for the `fluid.pouch` PouchDB component tests.
/* eslint-env node */
"use strict";
var fluid  = fluid || require("infusion");
var jqUnit = jqUnit || require("node-jqunit");

if (!fluid.pouch) {
    require("../../../");
    fluid.pouch.loadTestingSupport();
}

fluid.registerNamespace("fluid.tests.pouchdb.component.common");

// A CouchDB "map" function to test the `query` method.  The view only returns records that have a `color` value.
// See http://wiki.apache.org/couchdb/Introduction_to_CouchDB_views#Map_Functions
/* globals emit */
fluid.tests.pouchdb.component.common.map = function (doc) {
    if (doc.color) {
        emit(doc.color, doc);
    }
};

// A CouchDB "reduce" function to test the query method.  Generates a count of records by `color` value.
// See: http://wiki.apache.org/couchdb/Introduction_to_CouchDB_views#Reduce_Functions
fluid.tests.pouchdb.component.common.reduce = function (keys, values, rereduce) {
    var colorSummary = {};
    if (rereduce) {
        values.forEach(function (toReduce) {
            Object.keys(toReduce).forEach(function (key) {
                var subtotal = toReduce[key];
                colorSummary[key] = colorSummary[key] ? colorSummary[key] + subtotal : subtotal;
            });
        });
    }
    else {
        keys.forEach(function (entry) {
            var color = entry[0];
            colorSummary[color] = colorSummary[color] ? colorSummary[color] + 1 : 1;
        });
    }
    return colorSummary; // { red: 1, yellow: 2 }
};

fluid.defaults("fluid.tests.pouchdb.component.common.caseHolder.base", {
    gradeNames: ["fluid.test.express.caseHolder.base"],
    // Recreate the database before each test.
    sequenceStart: [{
        func: "{testEnvironment}.events.constructFixtures.fire"
    }],
    // Destroy the database after each test.
    sequenceEnd:   [
        {
            func: "{testEnvironment}.pouchDb.destroyPouch"
        },
        {
            event:    "{testEnvironment}.pouchDb.events.onPouchDestroyComplete",
            listener: "jqUnit.assertLeftHand",
            args:     ["The database should be destroyed on test completion...", { ok: true}, "{arguments}.0"]
        }
    ]
});


fluid.defaults("fluid.tests.pouchdb.component.common.caseHolder", {
    gradeNames: ["fluid.tests.pouchdb.component.common.caseHolder.base"],
    inputs: {
        bulkData: [
            {
                "_id": "one",
                "saying": "is the loneliest number"
            },
            {
                "_id": "two",
                "saying": "are required to tango"
            }
        ],
        mapReduce: [
            {
                "color": "red",
                "name": "strawberry"
            },
            {
                "color": "yellow",
                "name": "banana"
            },
            {
                "color": "red",
                "name": "cherry"
            },
            {
                "color": "blue",
                "name": "blueberry"
            },
            {
                name: "colorless glass noodles"
            }
        ]
    },
    expectedResponses: {
        bulkCreate: [{ ok: true, id: "one"}, { ok: true, id: "two"}]
    },
    rawModules: [{
        name: "Common tests for `fluid.pouch` component...",
        type: "test",
        tests: [
            {
                name: "Test the `info` method...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.info"
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onInfoComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The database info should be as expected...", { db_name: "test", doc_count: 0, update_seq: 0}, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `POST` method (with an ID)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.post",
                        args: [{ _id: "foo"}]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onPostComplete",
                        listener: "jqUnit.assertLeftHand",
                        args: ["The POST should have been successful...", { ok: true, id: "foo"}, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `GET` method (with a non-existent ID)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.get",
                        args: [{ _id: "notGonnaFindIt"}]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onError",
                        listener: "jqUnit.assert",
                        args: ["An error should be thrown if a record cannot be found..."]
                    }
                ]
            },
            {
                name: "Test the `PUT` method (with an ID)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.put",
                        args: [{ _id: "bar"}]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onPutComplete",
                        listener: "jqUnit.assertLeftHand",
                        args: ["The PUT should have been successful...", { ok: true, id: "bar"}, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `POST` method (without an ID)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.post",
                        args: [{ "onions": "raw" }]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onPostComplete",
                        listener: "{testEnvironment}.pouchDb.get",
                        args: ["{arguments}.0.id"]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onGetComplete",
                        listener: "jqUnit.assertLeftHand",
                        args: ["The record should have been POSTed...", { "onions": "raw"}, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `bulkDocs` function...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.bulkData"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "fluid.test.pouchdb.recordsAreEquivalent",
                        args:     ["The bulk creation of documents should have been successful...", "{that}.options.expectedResponses.bulkCreate", "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `allDocs` function...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.bulkData"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.allDocs",
                        args:     []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onAllDocsComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The bulk retrieval of all documents should return the correct number of records...", { offset: 0, total_rows: 2 }, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `bulkGet` function...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.bulkData"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.bulkGet",
                        args:     [{ docs: [{ id: "one" }, { id: "two"}]}]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkGetComplete",
                        listener: "fluid.test.pouchdb.recordsAreEquivalent",
                        args:     ["a bulk get of all documents should return the correct content...", [{ id: "one" }, { id: "two"}], "{arguments}.0.results"]
                    }
                ]
            },
            {
                name: "Test the `remove` function...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.bulkData"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.get",
                        args:     ["two"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onGetComplete",
                        listener: "{testEnvironment}.pouchDb.remove",
                        args:     ["{arguments}.0"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onRemoveComplete",
                        listener: "{testEnvironment}.pouchDb.info",
                        args:     []
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onInfoComplete",
                        listener: "jqUnit.assertLeftHand",
                        args:     ["The database should now only contain one record...", { db_name: "test", doc_count: 1 }, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Test the `remove` method (with a non-existent ID)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.remove",
                        args: [{ _id: "notGonnaFindIt"}]
                    },
                    {
                        event: "{testEnvironment}.pouchDb.events.onError",
                        listener: "jqUnit.assert",
                        args: ["An error should be thrown if a record cannot be found..."]
                    }
                ]
            },
            {
                name: "Testing `query` handling (passing a single map function)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.mapReduce"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.query",
                        args:     [fluid.tests.pouchdb.component.common.map]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onQueryComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["The view should return the right number of records...", 4, "{arguments}.0.rows.length" ]
                    }
                ]
            },
            {
                name: "Testing `query` handling (passing a map function as part of a JSON document)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.mapReduce"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.query",
                        args:     [{ map: fluid.tests.pouchdb.component.common.map}]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onQueryComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["The view should return the right number of records...", 4, "{arguments}.0.rows.length" ]
                    }
                ]
            },
            {
                name: "Testing `query` handling (passing both map and reduce function)...",
                sequence: [
                    {
                        func: "{testEnvironment}.pouchDb.bulkDocs",
                        args: ["{that}.options.inputs.mapReduce"]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onBulkDocsComplete",
                        listener: "{testEnvironment}.pouchDb.query",
                        args:     [{ map: fluid.tests.pouchdb.component.common.map, reduce: fluid.tests.pouchdb.component.common.reduce}]
                    },
                    {
                        event:    "{testEnvironment}.pouchDb.events.onQueryComplete",
                        listener: "jqUnit.assertDeepEq",
                        args:     ["The reduced data should be correct...", { red: 2, yellow: 1, blue: 1 }, "{arguments}.0.rows.0.value" ]
                    }
                ]
            }
        ]
    }]
});

fluid.defaults("fluid.tests.pouchdb.component.common.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        constructFixtures: null
    },
    components: {
        pouchDb: {
            type: "fluid.pouch",
            createOnEvent: "constructFixtures",
            options: {
                dbOptions: {
                    name: "test"
                }
            }
        },
        caseHolder: {
            type: "fluid.tests.pouchdb.component.common.caseHolder"
        }
    }
});
