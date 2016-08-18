/*

    Node-specific test helper functions.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.test.pouch");
/**
 *
 * A static function that can be used to inspect an HTTP response and confirm whether its status and body are as expected.
 *
 * @param response {Object} The response object, used to check the statusCode.
 * @param body {Anything} The body of the response returned by the server.
 * @param expectedStatus {Number} The expected HTTP status code associated with the response.
 * @param expectedBody {Anything} The expected body.
 *
 */
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

/**
 *
 * A static function to confirm that the correct number of records were returned.
 *
 * @param response {Object} The response object.
 * @param body {String} A string version of a JSON server response.  Will be parsed using `JSON.parse`.
 *
 */
gpii.test.pouch.checkRecordCount = function (response, body, expectedRecordCount) {
    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The correct number of records should have been returned...", expectedRecordCount, jsonData.doc_count);
};
