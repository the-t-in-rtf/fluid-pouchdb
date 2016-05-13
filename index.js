"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.module.register("gpii-pouchdb", __dirname, require);

require("./src/js/pouch");

fluid.registerNamespace("gpii.pouch");

gpii.pouch.loadTestingSupport = function () {
    // require("gpii-express");
    // gpii.express.loadTestingSupport();
    
    require("./tests/js/lib/environment");
    require("./tests/js/lib/harness");
    require("./tests/js/lib/helpers");
};