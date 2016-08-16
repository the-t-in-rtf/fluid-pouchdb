# `gpii.pouch.express.base`

The base component is a wrapper for [express-pouchdb](https://github.com/pouchdb/express-pouchdb).  See below for
variations (in-memory vs. filesystem data storage, persistent, etc.).  The component is also a
[`gpii.express.middleware` instance](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md)
that is meant to be wired into the root of [a `gpii.express` instance](https://github.com/GPII/gpii-express).

## Component Options

In addition to the options supported by the `gpii.express.router` component, this component has the following unique
options.

| Option                   | Type       | Description |
| ------------------------ | ---------- | ----------- |
| `databases` (required)   | `{Object}` | An object that describes one or more databases to create.  See below for full details. |
| `dbOptions`              | `{Object}` | Options that will be used when constructing each individual database. See [the PouchDB docs](https://pouchdb.com/api.html#create_database) for supported options. ]
| `expressPouchConfig`     | `{Object}` | Options that will be used when constructing the express-pouchdb instance. See [the express-pouchdb docs](https://github.com/pouchdb/express-pouchdb#api) for supported options.|
| `expressPouchConfigPath` | `{String}` | The path to the temporary file where the settings in `expressPouchConfig` will be stored and read by express-pouchdb.  The settings in `expressPouchConfig` will be saved to a file named `pouchdb.conf` in this directory.  Defaults to `os.tmpdir() + "/pouch.conf"`.|

### The `databases` option

The `databases` option is a hash, keyed by database name.  Each database may optionally contain a `data` element, which
is a string or an array of strings that represents the path to a JSON file (see below for the formats supported).  A
path can be the full path to a file on the local machine, or can be a package-relative path, such as `%my-package/tests/data/users.json`.
Here is an example of a `databases` option:

```
databases: {
    fullPath: { data: "/tmp/file.json" },
    packageRelative: { data: "%my-package/tests/data/file.json" },
    array: {
        data: [ "%my-other-package/tests/data/file1.json", "%my-other-package/tests/data/file2.json"]
    },
    empty: {} // Will be created, but without any data
}
```
## Component Invokers

### `{that}.cleanup()`
* Returns: A `Promise` that will be resolved once cleanup is complete (the `onCleanupComplete` event should also be fired.

This invoker is called when the `onCleanup` event is fired, which should indicate that it is time to remove any existing
data.  This grade provides only a stub, implementations are expected to override it with their own invoker.

### `{that}.initDb(dbKey, dbOptions)`
* `dbKey {String}`: The name of the database we are creating.
* `dbOptions {Object}`: The configuration options for the database we are creating.  This will typically be either a [`levelup`](https://github.com/Level/levelup#options) (filesystem) or [`memdown`](https://github.com/Level/memdown) (in-memory) database.
* Returns: A `Promise` that will be resolved once the database has been initialized.

### `{that}.initDbs()`
* Returns: A `Promise` that will be resolved once all databases have been initialized.

Initialize all of the databases configured in `options.databases` (see above).  The approach used varies depending on
whether we are working with filesystem or in-memory storage.  The base package provides only a stub which must be
overriden with another invoker.

### `{that}.middleware(request, response, next)`
* `request`: The [request object](http://expressjs.com/en/api.html#req) provided by Express, which wraps node's [`http.incomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).
* `response`: The [response object](http://expressjs.com/en/api.html#res) provided by Express, which wraps node's [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse).
* `next`: The next Express middleware or router function in the chain.
* Returns: Nothing.

Fulfills the standard contract for a `gpii.express.middleware` grade.  This invoker is backed by an instance of
express-pouchdb, which handles the actual requests and responses.

# `gpii.pouch.express`

An instance of `gpii.pouch.express.base` which has been configured to store its content on the filesystem.

## Component Options

In addition to the above component options, the `gpii.pouch.express` grade supports the following unique options:

| Option                   | Type       | Description |
| ------------------------ | ---------- | ----------- |
| `dbPath`  | `{String}` | A full or package-relative path to the directory in which database content should be stored.  By default, a subdirectory with this component's ID is created in `os.tmpDir()`, and content is stored there. |

If it does not already exist, this grade will create a directory at `options.dbPath` when it is created.

## Component Invokers

### `{that}.cleanup()`
* Returns: A `Promise` that will be resolved once cleanup is complete (the `onCleanupComplete` event should also be fired.

This invoker is called when the `onCleanup` event is fired, which should indicate that it is time to remove any existing
data.  Removes the full contents of `options.dbPath` (see above).

### `{that}.initDbs()`
* Returns: A `Promise` that will be resolved once all databases have been initialized.

Initialize all of the databases configured in `options.databases` (see above).


# `gpii.pouch.express.inMemory`

A component which is configured to store data in-memory rather than on the filesystem.

## Component Options

This grade does not have any unique configuration options beyond those provided by `gpii.pouch.express.base`

## Component Invokers

### `{that}.cleanup()`
* Returns: A `Promise` that will be resolved once cleanup is complete.

This invoker is called when the `onCleanup` event is fired, which should indicate that it is time to remove any existing
data.  Calls each database's `destroy` method and clears `memdown`'s cache.  Most tests will use the standard caseHolder
(see [the test docs for this package](tests.md)), which will fire `onCleanup` and then listen for `onCleanupComplete`.

### `{that}.initDbs()`
* Returns: A `Promise` that will be resolved once all databases have been initialized.

Initialize all of the databases configured in `options.databases` (see above).

## Component Invokers

### `{that}.initDb(dbKey, dbOptions)`
* `dbKey {String}`: The name of the database we are creating.
* `dbOptions {Object}`: The configuration options for the database we are creating.  Check the [`levelup` documentation](https://github.com/Level/levelup#options) for details.
* Returns: A `Promise` that will be resolved once the database has been initialized.

This invoker overrides the default `initDb` invoker and adds a check to confirm whether the database has already been populated.  If
the database already exists, it will be left alone.  If it does not already exist, it will be created and its data
will be loaded as outlined above.

# Using these grades in [Fluid IoC Tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

There are convenience grades and helper functions that make it easier to use `gpii.pouch` in Fluid IoC tests.  Please
see the [testing documentation](tests.md) in this package for details.

# Using these grades directly with a `gpii.express` instance

If you are working with another test framework, you can configure `gpii.pouch` to work with a `gpii.express` instance
as shown in this example:

    ```
    fluid.defaults("my.pouch.server.grade", {
        gradeNames: ["gpii.express"],
        port : "9989",
        components: {
            pouch: {
                type: "gpii.pouch",
                options: {
                    databases: {
                        sample:  { data: [ "%my-package/tests/data/sample1.json", "%my-package/tests/data/sample2.json"] },
                        _users:  { data: "%my-other-package/tests/data/users.json"},
                    }
                }
            }
        }
    });

    my.pouch.server.grade();
    ```

# Supported data file formats

There are two supported JSON file formats.  The first is simply an array of records, as in the following example:

```
[{ "name": "apple", "color": "red"}, { "name": "banana", "color": "yellow" }]
```

The second format is the same as used with [the CouchDB bulk document API](https://wiki.apache.org/couchdb/HTTP_Bulk_Document_API#Modify_Multiple_Documents_With_a_Single_Request).
Here's an example:

```
{
  "docs": [ { "_id": "myId", "foo": "bar"} ]
}
```

In both formats, an `_id` variable is optional, but if supplied, the value must be unique across all of the supplied
data files.
