"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.module.register("gpii-pouchdb", __dirname, require);

require("./src/js/pouch");

fluid.registerNamespace("gpii.pouch");

gpii.pouch.loadTestingSupport = function () {
    require("gpii-express");
    gpii.express.loadTestingSupport();
    
    require("./src/test/environment");
    require("./src/test/harness");
    require("./src/test/helpers");
};