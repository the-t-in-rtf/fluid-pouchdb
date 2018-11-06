/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.pouch");

/**
 *
 * An expander that can be used to wrap any port value in a form that can be used with {kettle.test.request.http}.send's
 * directOption parameter.  Required because our port is not known when our request components are created.
 *
 * @param {Integer} port - The port to connect to.
 * @return {Object} The supplied port, wrapped in an object with a `port` parameter.
 *
 */
gpii.test.pouch.wrapPort = function (port) {
    return { port: port };
};
