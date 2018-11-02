/* eslint-env node */
// Run all tests in this package in series.
"use strict";
var fluid = require("infusion");
fluid.setLogging(false);

require("./express-dataSource-integration-tests");
require("./timelyRimraf-tests");

require("./docker-couchdb-tests/");
require("./pouchdb-component-tests/");
