// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./harness");

fluid.setLogging(true);

gpii.pouch.tests.harness();
