/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.defaults("gpii.test.pouch.request", {
    gradeNames: ["kettle.test.request.http"],
    port:       "{testEnvironment}.options.port",
    method:     "GET"
});
