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

/*

    Common defaults reused in both the component defaults and in the `gpii.pouch.harness.removeContainer` static
    function.

*/
gpii.pouch.harness.defaults = {
    cleanOnStartup: true,
    commandTemplates: {
        getCouchPort:    "docker port %containerId 5984",
        healthCheck:     "docker ps -a --filter label=%containerLabel --format \"{{.Status}}\"",
        listContainers:  "docker ps --filter label=%containerLabel -q",
        removeContainer: "docker rm -f %containerId",
        startContainer:  "docker run -d -l %containerLabel -P --name %containerName couchdb"
    },
    containerLabel: "gpii-pouchdb-test-harness",
    containerMonitoringInterval: 1000,
    couchDbsToPreserve: ["_global_changes", "_replicator", "_users"],
    couchSetupCheckInterval: 250,
    couchSetupTimeout: 5000
};

/**
 *
 * List the containers labeled with "our" label.
 *
 * @param {Object} options - The command templates and variables to use when running the container list command.
 * @return {Promise} - A `fluid.promise` that will resolve with the list of container IDs or rejected if there's an error.
 *
 */
gpii.pouch.harness.listContainers = function (options) {
    return gpii.pouch.harness.runCommandAsPromise(
        options.commandTemplates.listContainers,
        options,
        "Checking for existing docker containers."
    );
};

/**
 *
 * A static function that searches for and removes any container with our label (`{that}.options.containerLabel`).
 *
 * @param {Object} options - Custom options to pass (for example, to search for a different label).
 * @return {Promise} - A `fluid.promise` that will resolve when the container is removed, or reject on error.
 *
 */
gpii.pouch.harness.removeContainer = function (options) {
    var mergedOptions = fluid.extend({}, gpii.pouch.harness.defaults, options);
    fluid.log("Removing container.");
    var containerRemovalPromise = fluid.promise();

    var containerListPromise = gpii.pouch.harness.listContainers(mergedOptions);
    containerListPromise.then(
        function (stdout) {
            var containerId = stdout.trim();
            if (containerId.length) {
                var innerContainerRemovalPromise = gpii.pouch.harness.runCommandAsPromise(mergedOptions.commandTemplates.removeContainer, { containerId: containerId });
                innerContainerRemovalPromise.then(
                    function () {
                        fluid.log("Container removed.");
                        containerRemovalPromise.resolve(stdout);
                    },
                    containerRemovalPromise.reject
                );
            }
            else {
                fluid.log("No container to remove.");
                containerRemovalPromise.resolve(stdout);
            }
        },
        containerRemovalPromise.reject
    );

    return containerRemovalPromise;
};

/**
 *
 * Docker exposes a random port for CouchDB.  This function detects that port and saves the numeric value to
 * `that.couchPort`.
 *
 * @param {Object} that - The component itself.
 * @param {String} containerId - The ID of the docker container.
 * @return {Promise} - A `fluid.promise` that will be resolved once the port is detected and saved or rejected on error.
 *
 */
gpii.pouch.harness.detectPort = function (that, containerId) {
    var portDetectionPromise = fluid.promise();
    var innerPortDetectionPromise = gpii.pouch.harness.runCommandAsPromise(fluid.get(that, "options.commandTemplates.getCouchPort"), { containerId: containerId });
    innerPortDetectionPromise.then(
        function (stdout) {
            // The output should be something like: 0.0.0.0:6789
            try {
                var resultSegments = stdout.split(":");
                that.couchPort = parseInt(resultSegments[resultSegments.length - 1].trim());
                portDetectionPromise.resolve(stdout);
            }
            // If the output was unparseable, we can't continue, as we'd been unable to communicate with our db.
            catch (parseError) {
                portDetectionPromise.reject(parseError);
            }
        },
        portDetectionPromise.reject
    );

    return portDetectionPromise;
};

/**
 *
 * A function to get the list of databases from a running couch instance and DELETE any that are not part of CouchDB's
 * internal housekeeping.
 *
 * @param {Object} that - The component itself.
 * @return {Promise} - A `fluid.promise` that will be resolved when all database are cleaned or rejected on an error.
 *
 */
gpii.pouch.harness.cleanExistingData = function (that) {
    fluid.log("Cleaning existing container.");
    var dataCleaningPromise = fluid.promise();

    // request the list of DBs.
    var allDbsUrl = fluid.stringTemplate("http://localhost:%port/_all_dbs", { port: that.couchPort });
    request.get(allDbsUrl, function (error, response, body) {
        if (error) {
            dataCleaningPromise.reject(error);
        }
        else {
            try {
                var dataCleaningPromises = [];
                var allDbs = JSON.parse(body);
                var dbsToRemove = fluid.filterKeys(allDbs, that.options.couchDbsToPreserve, true);
                fluid.each(dbsToRemove, function (dbName) {
                    dataCleaningPromises.push(function () {
                        var singleDbCleaningPromise = fluid.promise();
                        var dbUrl = fluid.stringTemplate("http://localhost:%port/%dbName", { port: that.couchPort, dbName: dbName });
                        request["delete"](dbUrl, function (error, response) {
                            if (error) {
                                singleDbCleaningPromise.reject(error);
                            }
                            else if (response.statusCode !== 200) {
                                singleDbCleaningPromise.reject("Response indicates an error removing the DB (" + response.statusCode + ").");
                            }
                            else {
                                singleDbCleaningPromise.resolve();
                            }
                        });
                        return singleDbCleaningPromise;
                    });
                });

                var dataCleaningSequence = fluid.promise.sequence(dataCleaningPromises);
                dataCleaningSequence.then(function () {
                    fluid.log("Cleaned existing container.");
                });

                dataCleaningSequence.then(dataCleaningPromise.resolve, dataCleaningPromise.reject);
            }
            catch (parseError) {
                dataCleaningPromise.reject(parseError);
            }
        }
    });

    return dataCleaningPromise;
};

/**
 *
 * Check to see if there is already a running container with our label.  If not, start one.  If so, clean out the
 * existing container.
 *
 * @param {Object} that - The component itself.
 * @return {Promise} - A `fluid.promise` instance that will resolve if the check is successful or reject if it's not.
 *
 */
gpii.pouch.harness.startIfNeeded = function (that) {
    var containerCheckPromise = fluid.promise();

    var initialContainerListPromise = gpii.pouch.harness.listContainers(that.options);

    initialContainerListPromise.then(
        function (stdout) {
            var containerResetPromises = [];

            // Start a new container if one isn't running.
            if (stdout.length === 0) {
                containerResetPromises.push(function () {
                    return gpii.pouch.harness.runCommandAsPromise(
                        that.options.commandTemplates.startContainer,
                        that.options,
                        "Starting container."
                    );
                });

                // Once creation is finished, detect the port of the newly created container.
                containerResetPromises.push(function () {
                    var portDetectionPromise = fluid.promise();
                    var postCreationContainerListPromise = gpii.pouch.harness.listContainers(that.options);
                    postCreationContainerListPromise.then(
                        function (stdout) {
                            var wrappedDetectionPromise = gpii.pouch.harness.detectPort(that, stdout.trim());
                            wrappedDetectionPromise.then(portDetectionPromise.resolve, portDetectionPromise.reject);
                        },
                        portDetectionPromise.reject
                    );
                    return portDetectionPromise;
                });
            }

            // If the container existed before, detect the port, and then clean out any existing data.
            if (stdout.length > 0) {
                fluid.log("Reusing existing container.");
                // Determine the randomly assigned port the container is exposing CouchDB on.
                containerResetPromises.push(function () {
                    return gpii.pouch.harness.detectPort(that, stdout.trim());
                });

                if (that.options.cleanOnStartup) {
                    containerResetPromises.push(function () {
                        return gpii.pouch.harness.cleanExistingData(that);
                    });
                }
            }

            if (that.options.cleanOnStartup || stdout.length === 0) {
                containerResetPromises.push(function () {
                    return gpii.pouch.harness.loadData(that);
                });
            }

            var containerResetSequence = fluid.promise.sequence(containerResetPromises);
            containerResetSequence.then(containerCheckPromise.resolve, containerCheckPromise.reject);
        },
        containerCheckPromise.reject
    );

    return containerCheckPromise;
};

/**
 *
 * Unsupported, non-API function.
 *
 * Run a command and then execute a callback.  NOTE:  This function is only intended for intervals and other edge cases.
 * You should use `gpii.pouch.harness.runCommandAsPromise` instead.
 *
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Object} commandPayload - The data to use to resolve variables in the template.
 * @param {Function} callback - A callback with the signature (error, stdout, stderr) that will be called after the command executes.
 * @param {String} [message] - An optional message that will be logged if present.
 *
 */
gpii.pouch.harness.runCommand = function (commandTemplate, commandPayload, callback, message) {
    if (message) {
        fluid.log(message);
    }

    var command = fluid.stringTemplate(
        commandTemplate,
        commandPayload
    );
    exec(command, callback);
};

/**
 *
 * Run a command and resolve/reject a promise when the results are known..
 *
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Object} commandPayload - The data to use to resolve variables in the template.
 * @param {String} [message] - An optional message that will be logged if present.
 * @return {Promise} A `fluid.promise` instance that will be resolved when the command completes succesfully or rejected if there's an error.
 *
 */
gpii.pouch.harness.runCommandAsPromise = function (commandTemplate, commandPayload, message) {
    var commandPromise = fluid.promise();

    try {
        gpii.pouch.harness.runCommand(commandTemplate, commandPayload, function (error, stdout) {
            if (error) {
                commandPromise.reject(error);
            }
            else {
                commandPromise.resolve(stdout);
            }
        }, message);
    }
    // Low-level errors like an `undefined` command template.
    catch (execError) {
        commandPromise.reject(execError);
    }

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
        that.options.commandTemplates.healthCheck,
        that.options,
        function (error, stdout) {
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
 * Construct a promise-returning function that will detect when a couch instance is ready to respond to requests.
 *
 * @param {Object} that - The component itself.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when couch is available or rejected if the instance doesn't respond in time.
 *
 */
gpii.pouch.harness.constructCouchReadyPromise = function (that) {
    return function () {
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
                    port: that.couchPort
                }
            );
            request.get(checkUrl, function (error, response) {
                if (!error && response.statusCode === 200) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    couchReadyPromise.resolve();
                }
                else {
                    fluid.log(fluid.logLevel.TRACE, "couch instance at '" + checkUrl + "' not ready, waiting " + that.options.couchSetupCheckInterval + " ms and trying again.");
                }
            });
        }, that.options.couchSetupCheckInterval);

        return couchReadyPromise;
    };
};

/**
 *
 * Construct a promise-returning function that will handle the creation of a single database.
 * @param {String} dbUrl - The URL for the database.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when the database is created or rejected on error.
 *
 */
gpii.pouch.harness.constructDbCreationPromise = function (dbUrl) {
    return function () {
        var dbCreationPromise = fluid.promise();

        fluid.log(fluid.logLevel.TRACE, "Starting creating database at ", dbUrl);
        request.put(dbUrl, function (error) {
            if (error) {
                dbCreationPromise.reject(error);
            }
            else {
                dbCreationPromise.resolve();
            }
            fluid.log(fluid.logLevel.TRACE, "Finished creating database", dbUrl);
        });

        return dbCreationPromise;
    };
};

/**
 *
 * Construct a promise-returning function that will handle the data loading for a single database.
 *
 * @param {String} dbUrl - The URL for the database.
 * @param {String} dbName - The name of the database.
 * @param {Object} dbDef - An object containing details about the database's data.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when the data is loaded or rejected on error.
 *
 */
gpii.pouch.harness.constructDataLoadingPromise = function (dbUrl, dbName, dbDef) {
    return function () {
        var dataLoadingPromise = fluid.promise();

        var dbBulkDocsUri = dbUrl + "/_bulk_docs";
        var allData = { docs: [] };
        fluid.each(fluid.makeArray(dbDef.data), function (dataFilePath) {
            try {
                var resolvedPath = fluid.module.resolvePath(dataFilePath);
                var data = require(resolvedPath);
                var fileDocs = fluid.get(data, "docs");
                if (fileDocs) {
                    allData.docs = allData.docs.concat(fileDocs);
                }
            }
            catch (error) {
                dataLoadingPromise.reject(error);
            }
        });

        if (!dataLoadingPromise.resolution) {
            var individualDbLoadingPromises = [];
            individualDbLoadingPromises.push(function () {
                var individualDataLoadingPromise = fluid.promise();
                fluid.log(fluid.logLevel.TRACE, "loading all data into database '"  + dbName + "'.");
                request.post({ uri: dbBulkDocsUri, body: allData, json: true, headers: { "Content-Type": "application/json" } }, function (error, response, body) {
                    if (error) { individualDataLoadingPromise.reject(error); }
                    else if ([200,201].indexOf(response.statusCode) === -1) {
                        individualDataLoadingPromise.reject(body);
                    }
                    else {
                        fluid.log(fluid.logLevel.TRACE, "Data loaded into database '"  + dbName + "'.");
                        individualDataLoadingPromise.resolve();
                    }
                });

                return individualDataLoadingPromise;
            });

            var dbLoadingSequence = fluid.promise.sequence(individualDbLoadingPromises);
            dbLoadingSequence.then(dataLoadingPromise.resolve, dataLoadingPromise.reject);
        }

        return dataLoadingPromise;
    };
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
                port: that.couchPort,
                db:   dbName
            }
        );

        // Create a promise that will only resolve when the couch instance within the container is actually responding.
        promises.push(gpii.pouch.harness.constructCouchReadyPromise(that));

        // create the database first.
        promises.push(gpii.pouch.harness.constructDbCreationPromise(dbUrl));

        // load each data file for this database.
        promises.push(gpii.pouch.harness.constructDataLoadingPromise(dbUrl, dbName, dbDef));
    });

    var sequence = fluid.promise.sequence(promises);
    return sequence;
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

fluid.defaults("gpii.pouch.harness", {
    gradeNames: ["fluid.component"],
    containerName: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["gpii-pouch-docker-harness-%id", { id: "{that}.id" }]
        }
    },
    // Options whose defaults are pulled from the static `gpii.pouch.harness.defaults` variable.
    cleanOnStartup:              gpii.pouch.harness.defaults.cleanOnStartup,
    commandTemplates:            gpii.pouch.harness.defaults.commandTemplates,
    containerLabel:              gpii.pouch.harness.defaults.containerLabel,
    containerMonitoringInterval: gpii.pouch.harness.defaults.containerMonitoringInterval,
    couchDbsToPreserve:          gpii.pouch.harness.defaults.couchDbsToPreserve,
    couchSetupCheckInterval:     gpii.pouch.harness.defaults.couchSetupCheckInterval,
    couchSetupTimeout:           gpii.pouch.harness.defaults.couchSetupTimeout,
    events: {
        onCleanup:          null,
        onCleanupComplete:  null,
        onShutdownComplete: null,
        onStartupComplete:  null,
        combinedCleanup:    null,
        combinedStartup:    null,
        combinedShutdown:   null
    },
    members: {
        couchPort: 9999,
        monitorInterval: false
    },
    invokers: {
        cleanup: {
            func: "{that}.events.onCleanup.fire"
        },
        shutdown: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedShutdown"]
        },
        startup: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedStartup"]
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
        "onStartupComplete.log": {
            funcName: "fluid.log",
            args:     ["Harness ready."]
        },
        "combinedCleanup.cleanExistingDAta": {
            priority: "first",
            funcName: "gpii.pouch.harness.cleanExistingData",
            args:     ["{that}"]
        },
        "combinedCleanup.loadData": {
            priority: "after:cleanExistingData",
            funcName: "gpii.pouch.harness.loadData",
            args:     ["{that}"]
        },
        "combinedCleanup.fireCleanupComplete": {
            priority: "after:loadData",
            func:     "{that}.events.onCleanupComplete.fire"
        },
        "combinedStartup.startIfNeeded": {
            priority: "first",
            funcName: "gpii.pouch.harness.startIfNeeded",
            args:     ["{that}"]
        },
        "combinedStartup.startMonitoring": {
            priority: "after:startIfNeeded",
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
        "combinedShutdown.fireEvent": {
            priority: "last",
            func:     "{that}.events.onShutdownComplete.fire"
        }
    }
});

fluid.defaults("gpii.pouch.harness.persistent", {
    gradeNames: ["gpii.pouch.harness"],
    cleanOnStartup: false
});
