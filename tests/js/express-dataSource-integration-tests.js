/* eslint-env node */
//  Testing the express "url encoded" dataSource with PouchDB
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../");
gpii.pouch.loadTestingSupport();

// Our local test dataSource grade that is aware of our starting URL (loopback)
fluid.defaults("gpii.tests.pouch.dataSource.testDataSource", {
    gradeNames: ["gpii.express.dataSource.urlEncodedJson"],
    endpoint: "rgb/_design/rgb/_view/byColor",
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["%baseUrl%endpoint", { baseUrl: "{testEnvironment}.options.baseUrl", endpoint: "{that}.options.endpoint"}]
        }
    }
});

gpii.tests.pouch.dataSource.compareResults = function (message, expected, actual) {
    // Compare everything but "rows"
    jqUnit.assertLeftHand(message + " (everything but rows)", fluid.censorKeys(expected, ["rows"]), actual);

    if (expected.rows) {
        // Compare the number of "rows"
        jqUnit.assertEquals(message + " (number of rows)", expected.rows.length, actual.rows.length);

        // Compare the individual "rows"
        if (expected.rows.length === actual.rows.length) {
            for (var a = 0; a < expected.rows.length; a++) {
                jqUnit.assertLeftHand(message + " (individual record #" + a + ")", expected.rows[a], actual.rows[a]);
            }
        }
    }
};

fluid.defaults("gpii.tests.pouch.dataSource.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder"],
    rawModules: [{
        name: "Integration tests for gpii-pouch and the 'url encoding' express dataSource grade...",
        tests: [
            {
                name: "We should be able to retrieve a record using a single key...",
                type: "test",
                sequence: [
                    {
                        func: "{singleKeyDataSource}.get",
                        args: ["{testEnvironment}.options.input.singleKey"]
                    },
                    {
                        listener: "gpii.tests.pouch.dataSource.compareResults",
                        event:    "{singleKeyDataSource}.events.onRead",
                        args:     ["The correct record should be returned...", "{testEnvironment}.options.expected.singleKey", "{arguments}.0"]
                    }
                ]
            },
            {
                name: "We should be able to retrieve multiple records using an array of keys...",
                type: "test",
                sequence: [
                    {
                        func: "{multiKeyDataSource}.get",
                        args: ["{testEnvironment}.options.input.multipleKeys"]
                    },
                    {
                        listener: "gpii.tests.pouch.dataSource.compareResults",
                        event:    "{multiKeyDataSource}.events.onRead",
                        args:     ["The correct records should be returned...", "{testEnvironment}.options.expected.multipleKeys", "{arguments}.0"]
                    }
                ]
            },
            {
                name: "We should be able to omit the payload altogether...",
                type: "test",
                sequence: [
                    {
                        func: "{noKeyDataSource}.get",
                        args: [{}]
                    },
                    {
                        listener: "gpii.tests.pouch.dataSource.compareResults",
                        event:    "{noKeyDataSource}.events.onRead",
                        args:     ["The whole list of records should be returned...", "{testEnvironment}.options.expected.emptyPayload", "{arguments}.0"]
                    }
                ]
            }
        ]
    }],
    components: {
        singleKeyDataSource: {
            type: "gpii.tests.pouch.dataSource.testDataSource"
        },
        multiKeyDataSource: {
            type: "gpii.tests.pouch.dataSource.testDataSource"
        },
        noKeyDataSource: {
            type: "gpii.tests.pouch.dataSource.testDataSource"
        }
    }
});

fluid.defaults("gpii.tests.pouch.dataSource.environment", {
    gradeNames: ["gpii.test.pouch.environment"],
    port: 9595,
    input: {
        singleKey:    { key: "red"},
        multipleKeys: { keys: ["red", "green"] }
    },
    expected: {
        singleKey: {
            total_rows: 3,
            offset: 0,
            rows: [
                { "id": "strawberry", "key": "red" }
            ]
        },
        multipleKeys: {
            total_rows: 3,
            offset: 0,
            rows: [
                { "id": "strawberry", "key": "red" },
                { "id": "mango", "key": "green"}
            ]
        },
        emptyPayload: {
            total_rows: 3,
            offset: 0,
            rows: [
                { "id": "blueberry", "key": "blue"},
                { "id": "mango", "key": "green"},
                { "id": "strawberry", "key": "red" }
            ]
        }
    },
    pouchConfig: {
        databases: {
            rgb:  { data: [ "%gpii-pouchdb/tests/data/rgb.json"] }
        }
    },
    components: {
        caseHolder: {
            type: "gpii.tests.pouch.dataSource.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.pouch.dataSource.environment");
