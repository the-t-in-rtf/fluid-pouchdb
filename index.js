/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.module.register("fluid-pouchdb", __dirname, require);

require("./src/js/timelyRimraf");
require("./src/js/pouchdb-common");
require("./src/js/pouchdb-node");
require("./src/js/pouch-express");
require("./src/js/harness");

fluid.registerNamespace("fluid.pouch");

fluid.pouch.loadTestingSupport = function () {
    require("fluid-express");
    fluid.express.loadTestingSupport();

    require("./src/test/environment");
    require("./src/test/common-helpers");
    require("./src/test/helpers");
    require("./src/test/request");
    require("./src/test/caseHolder");
};
