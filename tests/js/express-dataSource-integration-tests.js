/* eslint-env node */
//  Testing the express "url encoded" dataSource with PouchDB
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");
var kettle = require("kettle");

require("../../");
require("./lib/");

gpii.pouch.loadTestingSupport();

fluid.registerNamespace("gpii.tests.pouch.dataSource");

/**
 *
 * As we do not know our port ahead of time, we need a URL resolver that can both interpolate variables and append
 * query data.  This should never ever be used outside of these tests.
 *
 * @param {Object} that - The component itself.
 * @param {String} url - The URL (template) we will resolve.
 * @param {Object} directModel - The model to use when resolving query (and non-query) variables.
 * @return {String} - The resolved URL.
 *
 */
gpii.tests.pouch.dataSource.resolveUrl = function (that, url, directModel) {
    var modelMinusPort   = fluid.filterKeys(directModel, that.options.termsToStrip, true);
    var urlWithQueryData = gpii.express.dataSource.urlEncodedJson.resolveUrl(that, url, modelMinusPort);
    var urlWithTemplateVariablesResolved = kettle.dataSource.URL.resolveUrl(urlWithQueryData, that.options.termMap, directModel, true);
    return urlWithTemplateVariablesResolved;
};

/**
 *
 * Smash together the query input with the dynamic port value we need.  Is unpacked by the `fluid.filterKeys` call in
 * `gpii.tests.pouch.dataSource.resolveUrl`.
 *
 * @param {Object} inputModel - The original input model.
 * @param {Integer} port - The port on which CouchDB is available.
 * @return {Object} - The combined direct model that will be used in resolving the URL.
 *
 */
gpii.tests.pouch.dataSource.expandCombinedDirectModel = function (inputModel, port) {
    var combinedDirectModel = fluid.extend({}, inputModel, { port: port });
    return combinedDirectModel;
};

// Our local test dataSource grade that is aware of our starting URL (loopback)
fluid.defaults("gpii.tests.pouch.dataSource.testDataSource", {
    gradeNames: ["gpii.express.dataSource.urlEncodedJson"],
    url: "http://localhost:%port/rgb/_design/rgb/_view/byColor",
    termMap: {
        "port": "%port"
    },
    termsToStrip: ["port"],
    invokers: {
        resolveUrl: {
            funcName: "gpii.tests.pouch.dataSource.resolveUrl",
            args:     ["{that}", "{arguments}.0", "{arguments}.2"] // url, termMap (not used), directModel
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
    gradeNames: ["gpii.test.pouchdb.caseHolder"],
    rawModules: [{
        name: "Integration tests for gpii-pouch and the 'url encoding' express dataSource grade...",
        tests: [
            {
                name: "We should be able to retrieve a record using a single key...",
                type: "test",
                sequence: [
                    {
                        func: "{singleKeyDataSource}.get",
                        args: ["@expand:gpii.tests.pouch.dataSource.expandCombinedDirectModel({testEnvironment}.options.input.singleKey, {harness}.couchPort)"]
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
                        args: ["@expand:gpii.tests.pouch.dataSource.expandCombinedDirectModel({testEnvironment}.options.input.multipleKeys, {harness}.couchPort)"]
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
                        args: ["@expand:gpii.tests.pouch.dataSource.expandCombinedDirectModel({testEnvironment}.options.input.noKeys, {harness}.couchPort)"]
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
    input: {
        singleKey:    { key: "red"},
        multipleKeys: { keys: ["red", "green"] },
        noKeys:       {}
    },
    expected: {
        singleKey: {
            total_rows: 3,
            offset: 2,
            rows: [
                { "id": "strawberry", "key": "red" }
            ]
        },
        multipleKeys: {
            total_rows: 3,
            offset: 1,
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
            users: { data: "%gpii-pouchdb/tests/data/users.json" },
            rgb:   { data: ["%gpii-pouchdb/tests/data/rgb.json"] }
        }
    },
    components: {
        caseHolder: {
            type: "gpii.tests.pouch.dataSource.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.pouch.dataSource.environment");
