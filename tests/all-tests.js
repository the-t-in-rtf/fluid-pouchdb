/* Tests for the "pouch" module */
"use strict";
var fluid      = fluid || require("infusion");
var gpii       = fluid.registerNamespace("gpii");
var path       = require("path");
var jqUnit     = fluid.require("jqUnit");
var request    = require("request");

require("gpii-express");

require("../src/js/pouch.js");

function isSaneResponse(jqUnit, error, response, body, status) {
    status = status ? status : 200;
    jqUnit.assertNull("There should be no errors.", error);

    jqUnit.assertEquals("The response should have a reasonable status code", status, response.statusCode);
    if (response.statusCode !== status) {
        console.log(JSON.stringify(body, null, 2));
    }

    jqUnit.assertNotNull("There should be a body.", body);
}

function isSaneRecordBody(body, disableOkCheck) {
    var data = typeof body === "string" ? JSON.parse(body) : body;

    if (!disableOkCheck) {
        jqUnit.assertTrue("The response should be OK.", data.ok);
    }

    var id = data.id ? data.id : data._id;
    jqUnit.assertTrue("There should be id data.", id  !== null && id  !== undefined);

    var rev = data.rev ? data.id : data._rev;
    jqUnit.assertTrue("There should be revision data.", rev !== null && rev !== undefined);
}

function hasRecords(body){
    var data = (typeof body === "string") ? JSON.parse(body) : body;
    return data.doc_count && data.doc_count > 0;
}

var sampleDataFile  = path.resolve(__dirname, "./data/data.json");
var userDataFile    = path.resolve(__dirname, "./data/users.json");

// A ~100k data set to confirm that the async data loads do not take too long.
var massiveDataFile = path.resolve(__dirname, "./data/massive.json");

var pouch = gpii.express({
    "config": {
        "express": {
            "port" :   7532,
            "baseUrl": "http://localhost:7532/"
        }
    },
    components: {
        "pouch": {
            type: "gpii.pouch",
            options: {
                model: {
                    "databases": {
                        "_users":  { "data": userDataFile   },
                        "data":    { "data": sampleDataFile },
                        "massive": { "data": massiveDataFile},
                        "nodata":  {}
                    }
                }
            }
        }
    }
});


jqUnit.module("Testing pouch module stack...");

jqUnit.asyncTest("Testing the 'massive' database (should contain data)...", function() {
    var options = {
        url: pouch.options.config.express.baseUrl + "massive"
    };
    request.get(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body);

        jqUnit.assertTrue("There should be records.", hasRecords(body));
    });
});

jqUnit.asyncTest("Testing the root of the pouch instance...", function() {
    var options = {
        url: pouch.options.config.express.baseUrl
    };
    request.get(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body);
    });
});

jqUnit.asyncTest("Testing the 'nodata' database (should not contain data)...", function() {
    var options = {
        url: pouch.options.config.express.baseUrl + "nodata"
    };
    request.get(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body);

        jqUnit.assertFalse("There should be no records.", hasRecords(body));
    });
});

jqUnit.asyncTest("Testing the 'data' database (should contain data)...", function() {
    var options = {
        url: pouch.options.config.express.baseUrl + "data"
    };
    request.get(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body);

        jqUnit.assertTrue("There should be records.", hasRecords(body));
    });
});

// TODO:  test inserts
jqUnit.asyncTest("Testing insertion of a new record...", function() {
    var options = {
        url:  pouch.options.config.express.baseUrl + "data",
        json: { "foo": "bar" }
    };
    request.post(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body, 201);
        isSaneRecordBody(body);
    });
});

jqUnit.asyncTest("Testing reading of a record...", function() {
    var options = {
        url:  pouch.options.config.express.baseUrl + "data/foo"
    };
    request.get(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body, 200);
        isSaneRecordBody(body, true);

        var data = (typeof body === "string") ? JSON.parse(body) : body;
        jqUnit.assertEquals("There should be document data.", "bar", data.foo);
    });
});

jqUnit.asyncTest("Testing deletion of a record...", function() {
    var options = {
        url:  pouch.options.config.express.baseUrl + "data/todelete"
    };
    request.del(options, function(error, response, body){
        jqUnit.start();
        isSaneResponse(jqUnit, error,response, body, 200);
        isSaneRecordBody(body);
    });
});