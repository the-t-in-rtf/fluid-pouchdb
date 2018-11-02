/* eslint-env node */
// Common test harness for use both in tests and for manual QA.  To use for manual QA, run the `launch-test-harness.js`
// script in this directory.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var exec   = require("child_process").exec;
var request = require("request");

require("gpii-express");
fluid.require("%gpii-pouchdb");

fluid.registerNamespace("gpii.pouch.harness");

/**
 *
 * Run a docker command to confirm that there are no other instances running.
 *
 * @param {Object} that - The component itself.
 * @return {Promise} - A `fluid.promise` instance that will resolve if the check is successful or reject if it's not.
 *
 */
gpii.pouch.harness.checkForExistingContainers = function (that) {
    var containerCheckPromise = fluid.promise();

    var containerCheckCallback = function (error, stdout) {
        if (error) {
            containerCheckPromise.reject(error);
        }
        else if (stdout.length > 0) {
            containerCheckPromise.reject("There are one or more existing gpii-pouchdb docker containers, cannot continue.");
        }
        else {
            containerCheckPromise.resolve();
        }
    };

    gpii.pouch.harness.runCommand(that, "docker ps --filter label=gpii-pouchdb -q", containerCheckCallback, "Checking for existing gpii-pouchdb containers.");

    return containerCheckPromise;
};

/**
 *
 * Run a command and execute a callback.
 *
 * @param {Object} that - The component itself.
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Function} callback - A callback that will be called when the command completes.
 * @param {String} [message] - An optional message that will be logged if present.
 *
 */
gpii.pouch.harness.runCommand = function (that, commandTemplate, callback, message) {
    if (message) {
        fluid.log(message);
    }

    var command = fluid.stringTemplate(
        commandTemplate,
        that.options
    );
    exec(command, callback);
};

/**
 *
 * Run a command and resolve/reject a promise when the results are known..
 *
 * @param {Object} that - The component itself.
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {String} [message] - An optional message that will be logged if present.
 * @return {Promise} A `fluid.promise` instance that will be resolved when the command completes succesfully or rejected if there's an error.
 *
 */
gpii.pouch.harness.runCommandAsPromise = function (that, commandTemplate, message) {
    var commandPromise = fluid.promise();

    gpii.pouch.harness.runCommand(that, commandTemplate, function (error) {
        if (error) {
            commandPromise.reject(error);
        }
        else {
            commandPromise.resolve();
        }
    }, message);

    return commandPromise;
};

/**
 *
 * Start monitoring the health of the associated docker container so that we can shut ourselves down if it fails to
 * start up or is stopped externally using a docker command.
 *
 * @param {Object} that - The component itself.
 *
 */
gpii.pouch.harness.startMonitoring = function (that) {
    that.monitorInterval = setInterval(
        gpii.pouch.harness.runCommand,
        that.options.containerMonitoringInterval,
        that, "docker ps -a --filter name=%containerName --format \"{{.Status}}\"", function (error, stdout) {
            fluid.log(fluid.logLevel.TRACE, "health check.");
            // If we can't verify that our container is up, exit.
            if (error || stdout.indexOf("Up") !== 0) {
                clearInterval(that.monitorInterval);
                that.destroy();
            }
            // Otherwise, keep running, i.e. don't let the node process exit.
        }
    );
};

/**
 *
 * Create the required databases and populate them with data.
 *
 * @param {Object} that - The component itself.
 * @return {Promise} - A `fluid.promise` instance that will be resolved when the data is loaded or rejected if an error occurs.
 *
 */
gpii.pouch.harness.loadData = function (that) {
    fluid.log("Loading data.");
    var promises = [];
    // connect to localhost:PORT once for each data payload.
    fluid.each(that.options.databases, function (dbDef, dbName) {
        var dbUrl = fluid.stringTemplate(
            "http://localhost:%port/%db",
            {
                port: that.options.port,
                db: dbName
            }
        );

        // Create a promise that will only resolve when the couch instance within the container is actually responding.
        promises.push(function () {
            var couchReadyPromise = fluid.promise();
            var timeout = setTimeout( function () {
                if (!couchReadyPromise.disposition) {
                    couchReadyPromise.reject();
                }
            }, that.options.couchSetupTimeout);
            var interval = setInterval(function () {
                var checkUrl = fluid.stringTemplate(
                    "http://localhost:%port/",
                    {
                        port: that.options.port
                    }
                );
                request.get(checkUrl, function (error, response) {
                    if (!error && response.statusCode === 200) {
                        clearTimeout(timeout);
                        clearInterval(interval);
                        couchReadyPromise.resolve();
                    }
                    else {
                        fluid.log(fluid.logLevel.TRACE, "couch instance not ready, waiting " + that.options.couchSetupCheckInterval + " ms and trying again.");
                    }
                });
            }, that.options.couchSetupCheckInterval);

            return couchReadyPromise;
        });
        // create the databases first.
        promises.push(function () {
            var dbCreationPromise = fluid.promise();

            request.put(dbUrl, function (error) {
                if (error) {
                    dbCreationPromise.reject(error);
                }
                else {
                    dbCreationPromise.resolve();
                }
            });

            return dbCreationPromise;
        });

        // load each data file for this database.
        var dbBulkDocsUri = dbUrl + "/_bulk_docs";
        fluid.each(fluid.makeArray(dbDef.data), function (dataFilePath) {
            promises.push(function () {
                fluid.log(fluid.logLevel.TRACE, "loading data from '" + dataFilePath + "' into database '"  + dbName + "'.");
                var singleFileLoadingPromise = fluid.promise();
                try {
                    var resolvedPath = fluid.module.resolvePath(dataFilePath);
                    var data = require(resolvedPath);

                    request.post({ uri: dbBulkDocsUri, body: data, json: true, headers: { "Content-Type": "application/json" } }, function (error, response, body) {

                        if (error) { singleFileLoadingPromise.reject(error); }
                        else if ([200,201].indexOf(response.statusCode) === -1) {
                            singleFileLoadingPromise.reject(body);
                        }
                        else {
                            singleFileLoadingPromise.resolve();
                        }
                    });
                }
                catch (error) {
                    singleFileLoadingPromise.reject(error);
                }

                return singleFileLoadingPromise;
            });
        });
    });

    var sequence = fluid.promise.sequence(promises);
    return sequence;
};

/**
 *
 * Fire our combined "transforming promise chain" `combinedStart` event
 *
 * @param {Object} that - The component itself.
 *
 */
gpii.pouch.harness.fireCombinedStart = function (that) {
    var eventTransformChain = fluid.promise.fireTransformEvent(that.events.combinedStartup);
    eventTransformChain.then(
        that.events.onReady.fire,
        that.handleError
    );
};

/**
 *
 * A common "ejection lever" that logs and error and destroys the component when an error occurs.
 *
 * @param {Object} that - The component itself.
 * @param {Any} error - The error to log.
 *
 */
gpii.pouch.harness.handleError = function (that, error) {
    fluid.log(fluid.logLevel.ERROR, "ERROR:", error);
    that.destroy();
};

/**
 *
 * Clear the "health check" monitoring interval and discontinue monitoring.
 *
 * @param {Object} that - The component itself.
 *
 */
gpii.pouch.harness.clearInterval = function (that) {
    if (that.monitorInterval) {
        clearInterval(that.monitorInterval);
        that.monitorInterval = false;
    }
};

/**
 *
 * The removal command returns before the container is actually removed.  This check ensures that shutdown is not
 * considered complete until either the container is removed or until a configurable timeout is reached. The frequency
 * of the check is configured using `that.options.containerShutdownCheckInterval`.  The timeout is configured using
 * `that.options.containerShutdownTimeout`.
 *
 * @param {Object} that - The component itself.
 * @return {Promise} - A `fluid.promise` instance that resolves when the container has been verified as having been removed or rejects on an error or timeout.
 *
 */
gpii.pouch.harness.verifyContainerRemoved = function (that) {
    var containerCheckPromise = fluid.promise();

    var containerCheckCallback = function (error, stdout) {
        if (error) {
            fluid.log(fluid.logLevel.ERROR, "Error attempting to verify container was removed.");
            containerCheckPromise.reject(error);
        }
        else if (stdout.length > 0) {
            fluid.log(fluid.logLevel.TRACE, "Container has not been removed yet.");
        }
        else {
            clearTimeout(timeout);
            clearInterval(interval);
            fluid.log(fluid.logLevel.TRACE, "Container has been removed.");
            containerCheckPromise.resolve();
        }
    };

    var timeout = setTimeout(function () {
        if (!containerCheckPromise.disposition) {
            containerCheckPromise.reject("Timed out when attempting to remove docker container.");
        }
    }, that.options.containerShutdownTimeout);

    var interval = setInterval(
        gpii.pouch.harness.runCommand,
        that.options.containerShutdownCheckInterval,
        that,
        "docker ps --filter name=%containerName -q",
        containerCheckCallback,
        "Verifying that container has been removed."
    );

    return containerCheckPromise;
};

fluid.defaults("gpii.pouch.harness", {
    gradeNames: ["fluid.component"],
    containerName: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["gpii-pouch-docker-harness-%id", { id: "{that}.id" }]
        }
    },
    containerMonitoringInterval: 1000,
    containerShutdownCheckInterval: 250,
    containerShutdownTimeout: 1000,
    couchSetupCheckInterval: 250,
    couchSetupTimeout: 5000,
    events: {
        onReady:            null,
        onCleanup:          null,
        onShutdownComplete: null,
        onStartupComplete:  null,
        combinedCleanup:    null,
        combinedStartup:    null,
        combinedShutdown:   null
    },
    members: {
        monitorInterval: false
    },
    invokers: {
        cleanup: {
            func: "{that}.events.onCleanup.fire"
        },
        handleError: {
            funcName: "gpii.pouch.harness.handleError",
            args:     ["{that}", "{arguments}.0"] // error
        },
        shutdown: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedShutdown"]
        },
        startup: {
            funcName: "gpii.pouch.harness.fireCombinedStart",
            args:     ["{that}"]
        }
    },
    listeners: {
        "onCreate.fireCombinedStart": {
            func: "{that}.startup"
        },
        "onCleanup.fireCombinedCleanup": {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedCleanup"]
        },
        "onDestroy.shutdown": {
            func: "{that}.shutdown"
        },
        "onReady.log": {
            funcName: "fluid.log",
            args:     ["Harness ready."]
        },
        "combinedCleanup.shutdown": {
            priority: "first",
            func:     "{that}.shutdown"
        },
        "combinedCleanup.startup": {
            priority: "after:shutdown",
            func:     "{that}.startup"
        },
        "combinedStartup.checkForExistingContainers": {
            priority: "first",
            funcName: "gpii.pouch.harness.checkForExistingContainers",
            args:     ["{that}"]
        },
        "combinedStartup.startContainer": {
            priority: "after:checkForExistingContainers",
            funcName: "gpii.pouch.harness.runCommandAsPromise",
            // commandTemplate, message
            args:     [
                "{that}",
                "docker run -d -l gpii-pouchdb -p %port:5984 --name %containerName couchdb",
                "Starting container."
            ]
        },
        "combinedStartup.loadData": {
            priority: "after:startContainer",
            funcName: "gpii.pouch.harness.loadData",
            args:     ["{that}"]
        },
        "combinedStartup.startMonitoring": {
            priority: "after:loadData",
            funcName: "gpii.pouch.harness.startMonitoring",
            args:     ["{that}"]
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func:      "{that}.events.onStartupComplete.fire"
        },
        "combinedShutdown.clearInterval": {
            priority: "first",
            funcName: "gpii.pouch.harness.clearInterval",
            args:     ["{that}"]
        },
        "combinedShutdown.removeContainer": {
            priority: "first",
            funcName: "gpii.pouch.harness.runCommandAsPromise",
            // commandTemplate, message
            args:     [
                "{that}",
                "docker rm -f %containerName",
                "Removing container."
            ]
        },
        "combinedShutdown.verifyContainerRemoved": {
            priority: "after:removeContainer",
            funcName: "gpii.pouch.harness.verifyContainerRemoved",
            args:     ["{that}"]
        },
        "combinedShutdown.fireEvent": {
            priority: "last",
            func:      "{that}.events.onShutdownComplete.fire"
        }
    }
});
