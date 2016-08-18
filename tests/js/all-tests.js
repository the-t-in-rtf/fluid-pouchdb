// Run all tests in this package in series.
"use strict";
var fluid = require("infusion");
fluid.setLogging(false);

require("./basic-tests");
require("./reload-tests");
require("./persistence-tests");
require("./pouchdb-component-tests");
