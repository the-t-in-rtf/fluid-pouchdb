/* eslint-env node */
// The pouchConfig used in these tests and in the test harness launcher
"use strict";
var fluid = require("infusion");

fluid.registerNamespace("fluid.tests.pouch.config");

fluid.tests.pouch.config.databases = {
    sample:           { data: [ "%fluid-pouchdb/tests/data/data.json", "%fluid-pouchdb/tests/data/supplemental.json"] },
    _users:           { data: "%fluid-pouchdb/tests/data/users.json"},
    // A ~100k data set to confirm that the async data loads do not take too long.
    massive:          { data: "%fluid-pouchdb/tests/data/massive.json"},
    rgb:              { data: "%fluid-pouchdb/tests/data/rgb.json"},
    nodata:           {},
    _replicator:      {},
    pouch__all_dbs__: {}
};
