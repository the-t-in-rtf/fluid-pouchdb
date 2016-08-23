// Run all tests in this package in series.
"use strict";
var fluid = require("infusion");
fluid.setLogging(false);

require("./pouchdb-express-tests/");
require("./pouchdb-component-tests/");
