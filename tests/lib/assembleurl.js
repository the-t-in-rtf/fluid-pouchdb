// An expander to put together a base URL and relative path.
// TODO: Consider moving this to a stringTemplate based system instead.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");


fluid.registerNamespace("gpii.pouch.tests");
gpii.pouch.tests.assembleUrl = function (baseUrl, path, that) {
    var fullPath;
    // We have to be careful of double slashes (or no slashes)
    if (baseUrl[baseUrl.length - 1] === "/" && path[0] === "/") {
        fullPath = baseUrl + path.substring(1);
    }
    else if (baseUrl[baseUrl.length - 1] !== "/" && path[0] !== "/") {
        fullPath = baseUrl + "/" + path;
    }
    else {
        fullPath = baseUrl + path;
    }
    return fullPath;
};