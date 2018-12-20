/*

    A wrapper to allow our crude folder cleanup function to be used from the command line.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../src/js/delete-folder");

fluid.setLogging(true);
gpii.pouch.deleteFolderRecursive.runAsCommand();
