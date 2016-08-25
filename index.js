"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.module.register("gpii-pouchdb", __dirname, require);

require("./src/js/pouchdb-common");
require("./src/js/pouchdb-node");
require("./src/js/pouch-express");
require("./src/js/harness");

fluid.registerNamespace("gpii.pouch");

gpii.pouch.loadTestingSupport = function () {
    require("gpii-express");
    gpii.express.loadTestingSupport();

    require("./src/test/environment");
    require("./src/test/common-helpers");
    require("./src/test/helpers");
    require("./src/test/request");
    require("./src/test/caseHolder");
};
