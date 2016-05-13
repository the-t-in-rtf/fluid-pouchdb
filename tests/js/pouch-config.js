// The pouchConfig used in these tests and in the test harness launcher
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.tests.pouch.config");

gpii.tests.pouch.config.databases = {
    sample:  { data: [ "%gpii-pouchdb/tests/data/data.json", "%gpii-pouchdb/tests/data/supplemental.json"] },
    _users:  { data: "%gpii-pouchdb/tests/data/users.json"},
    // A ~100k data set to confirm that the async data loads do not take too long.
    massive: { data: "%gpii-pouchdb/tests/data/massive.json"},
    nodata:  {}
};