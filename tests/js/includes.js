"use strict";
var fluid = require("infusion");
fluid.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("./harness");
require("./environment");
require("./lib/helpers");
