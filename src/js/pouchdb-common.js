/*

    Provide a component that wraps an individual PouchDB instance.

    https://github.com/GPII/gpii-pouchdb/blob/master/docs/pouchdb.md

 */
/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var PouchDB = PouchDB || require("pouchdb");

fluid.registerNamespace("gpii.pouch");

gpii.pouch.init = function (that) {
    that.pouchDb = new PouchDB(that.options.dbOptions);
    // fluid.log("Pouch instance `" + that.options.dbOptions.name + "` (" + that.id + ") initialized...");
};

/**
 *
 * Call an underlying PouchDb function and fire the named function on completion.
 *
 * @param that - The component itself.
 * @param fnName {String} - The name of the PouchDB function to call.
 * @param fnArgs {Array} - The arguments (minus the final callback) to pass to the function.
 * @param eventName {String} - The event to fire on completion.
 *
 */
gpii.pouch.callPouchFunction = function (that, fnName, fnArgs, eventName) {
    var promise = fluid.promise();

    var wrappedCallback = function (err, results) {
        if (err) {
            promise.reject(err);
            that.events.onError.fire(err);
        }
        else {
            promise.resolve(results);
            that.events[eventName].fire(results);
        }
    };

    // Add the event firer callback to the list of arguments as the final argument.  If there are no args, we create
    // an empty array first.
    var fullArgs = fluid.makeArray(fnArgs).concat(wrappedCallback);
    that.pouchDb[fnName].apply(that.pouchDb, fullArgs);

    return promise;
};

fluid.defaults("gpii.pouch", {
    gradeNames: ["fluid.component"],
    dbOptions: {
        skip_setup: true
    },
    events: {
        onAllDocsComplete: null,
        onBulkDocsComplete: null,
        onBulkGetComplete: null,
        onCompactComplete: null,
        onDestroyPouchComplete: null,
        onError: null,
        onGetComplete: null,
        onGetAttachmentComplete: null,
        onInfoComplete: null,
        onPostComplete: null,
        onPutComplete: null,
        onPutAttachmentComplete: null,
        onQueryComplete: null,
        onRemoveComplete: null,
        onRemoveAttachmentComplete: null,
        onViewCleanupComplete: null
    },
    invokers: {
        allDocs: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "allDocs", "{arguments}", "onAllDocsComplete"] // fnName, fnArgs, eventName
        },
        bulkDocs: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "bulkDocs", "{arguments}", "onBulkDocsComplete"] // fnName, fnArgs, eventName
        },
        bulkGet: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "bulkGet", "{arguments}", "onBulkGetComplete"] // fnName, fnArgs, eventName
        },
        compact: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "compact", "{arguments}", "onCompactComplete"] // fnName, fnArgs, eventName
        },
        destroyPouch: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "destroy", "{arguments}", "onDestroyPouchComplete"] // fnName, fnArgs, eventName
        },
        get: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "get", "{arguments}", "onGetComplete"] // fnName, fnArgs, eventName
        },
        getAttachment: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["getAttachment", "{arguments}", "onGetAttachmentComplete"] // fnName, fnArgs, eventName
        },
        info: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "info", "{arguments}", "onInfoComplete"] // fnName, fnArgs, eventName
        },
        post: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "post", "{arguments}", "onPostComplete"] // fnName, fnArgs, eventName
        },
        put: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "put", "{arguments}", "onPutComplete"] // fnName, fnArgs, eventName
        },
        putAttachment: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "putAttachment", "{arguments}", "onPutAttachmentComplete"] // fnName, fnArgs, eventName
        },
        query: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "query", "{arguments}", "onQueryComplete"] // fnName, fnArgs, eventName
        },
        remove: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "remove", "{arguments}", "onRemoveComplete"] // fnName, fnArgs, eventName
        },
        removeAttachment: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "removeAttachment", "{arguments}", "onRemoveAttachmentComplete"] // fnName, fnArgs, eventName
        },
        viewCleanup: {
            funcName: "gpii.pouch.callPouchFunction",
            args: ["{that}", "viewCleanup", "{arguments}", "onViewCleanupComplete"] // fnName, fnArgs, eventName
        }
    },
    listeners: {
        "onCreate.initPouch": {
            funcName: "gpii.pouch.init",
            args:     ["{that}"]
        }
    }
});
