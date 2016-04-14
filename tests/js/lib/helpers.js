"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.test.pouch");
gpii.test.pouch.checkResponse = function (response, body, expectedStatus, expectedBody) {
    expectedStatus = expectedStatus ? expectedStatus : 200;

    var bodyData = JSON.parse(body);

    gpii.test.express.helpers.isSaneResponse(response, body, expectedStatus);

    // NOTE:  This only works for results where you know the exact response or a simple subset.  Deeply inserted
    // "couchisms" such as record `_id` and `_rev` values must be checked separately.  See the tests in gpii-pouchdb-lucene for an example.
    if (expectedBody) {
        jqUnit.assertLeftHand("The body should be as expected...", expectedBody, bodyData);
    }
};

gpii.test.pouch.checkRecordCount = function (response, body) {
    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("There should be four records...", 4, jsonData.doc_count);
};
