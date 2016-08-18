/*

    Cross-platform test helper functions.

 */
/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = jqUnit || require("node-jqunit");

fluid.registerNamespace("gpii.test.pouchdb");

/**
 *
 * Helper function to work around the limitations of jqUnit.assertLeftHand, which cannot handle check deep array
 * content in the way we need.  Used to confirm that everything but the CouchDB/PouchDB material (ids, etc.) is as
 * expected.
 *
 * @param message {String} The message that will be used with the tests (it will have sub-messages appended to it).
 * @param expected {Array} An array of expected results.
 * @param actual {Array} An array of actual output to compare to the expected results.
 *
 */
gpii.test.pouchdb.recordsAreEquivalent = function (message, expected, actual) {
    jqUnit.assertEquals(message + " (record count)", expected.length, actual.length);
    for (var a = 0; a < expected.length; a++) {
        jqUnit.assertLeftHand(message + " (array position " + a + ")", expected[a], actual[a]);
    }
};
