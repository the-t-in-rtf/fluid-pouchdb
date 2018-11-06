/* eslint-env node */
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii = fluid.registerNamespace("gpii");

require("../../");

var removalPromise = gpii.pouch.harness.removeContainer();

removalPromise.then(
    function () {
        fluid.log("Docker container has been removed.");
    },
    fluid.fail
);
