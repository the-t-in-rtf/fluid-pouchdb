// Run all tests in this package in series.
"use strict";

var events = require("events");
events.EventEmitter.defaultMaxListeners = 100;

require("./basic-tests");
require("./reload-tests");

