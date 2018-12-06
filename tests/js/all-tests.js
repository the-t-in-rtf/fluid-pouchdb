/* eslint-env node */
// Run all tests in this package in series.
"use strict";
var fluid = require("infusion");
fluid.setLogging(false);

require("./express-dataSource-integration-tests");

// TODO: restore these if the "timely rimraf" stuff ends up surviving the express-pouchdb purge.
//require("./timelyRimraf-tests");

require("./pouchdb-express-tests/");
require("./pouchdb-component-tests/");
