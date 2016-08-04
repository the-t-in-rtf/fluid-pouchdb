// Run all tests in this package in series.
"use strict";
var fluid = require("infusion");
fluid.setLogging(false);

// There is a leak when repeatedly launching express-pouchdb, there is currently no fix.
//
// (node) warning: possible EventEmitter memory leak detected. 11 created listeners added. Use emitter.setMaxListeners() to increase limit.
// Trace
// at EventEmitter.addListener (events.js:179:15)
// at module.exports (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/pouchdb-all-dbs/index.js:61:9)
// at /Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/lib/index.js:143:35
// at tryCatcher (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/util.js:26:23)
// at Promise._settlePromiseFromHandler (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/promise.js:507:31)
// at Promise._settlePromiseAt (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/promise.js:581:18)
// at Promise._settlePromises (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/promise.js:697:14)
// at Async._drainQueue (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/async.js:123:16)
// at Async._drainQueues (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/async.js:133:10)
// at Immediate.Async.drainQueues [as _onImmediate] (/Users/duhrer/Source/rtf/gpii-pouchdb/node_modules/express-pouchdb/node_modules/bluebird/js/main/async.js:15:14)
//
//
// We avoid the error using the next two lines:
var events = require("events");
events.EventEmitter.defaultMaxListeners = 50;

require("./basic-tests");
require("./reload-tests");

