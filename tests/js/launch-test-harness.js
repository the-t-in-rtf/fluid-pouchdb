// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./harness");

fluid.setLogging(true);

gpii.test.pouch.harness({
    port:       6789,
    baseUrl:    "http://localhost:6789/"
});
