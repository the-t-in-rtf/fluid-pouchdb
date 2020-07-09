# `fluid.pouch.express.base`

The base component is a wrapper for [express-pouchdb](https://github.com/pouchdb/express-pouchdb).  See below for
variations (in-memory vs. filesystem data storage, persistent, etc.).  The component is also a
[`fluid.express.middleware` instance](https://github.com/fluid-project/fluid-express/blob/master/docs/middleware.md)
that is meant to be wired into the root of [a `fluid.express` instance](https://github.com/fluid-project/fluid-express).

## Component Options

In addition to the options supported by the `fluid.express.router` component, this component has the following unique
options.

| Option                    | Type       | Description |
| ------------------------- | ---------- | ----------- |
| `baseDir`                 | `String`   | The path to the "base directory" that will contain our logs and database content.  Defaults to a subdirectory under `os.tmpdir()` that matches the component ID. |
| `databases` (required)    | `{Object}` | An object that describes one or more databases to create.  See below for full details. |
| `dbOptions`               | `{Object}` | Options that will be used when constructing each individual database. See [the PouchDB docs](https://pouchdb.com/api.html#create_database) for supported options. ]
| `expressPouchConfig`      | `{Object}` | Options that will be used when constructing the express-pouchdb instance. See [the express-pouchdb docs](https://github.com/pouchdb/express-pouchdb#api) for supported options. |
| `expressPouchLogFilename` | `{String}` | The log file name to create in `expressPouchLogPath` (see below).  Defaults to `express-pouchdb-log-{component_id}.txt`. |
| `expressPouchLogPath`     | `{String}` | The full path to the log file.  By default, the file is stored in `options.baseDir` under the name defined in `options.expressPouchLogFilename` (see above). |
| `rimrafTimeout`           | `{Number}` | When cleaning up filesystem content, the number of milliseconds to wait before forcing a timeout.  Defaults to `1000` (one second). |

### The `databases` option

The `databases` option is a hash, keyed by database name.  Each database may optionally contain a `data` element, which
is a string or an array of strings that represents the path to a JSON file (see below for the formats supported).  A
path can be the full path to a file on the local machine, or can be a package-relative path, such as
`%my-package/tests/data/users.json`.

Here is an example `databases` option that demonstrates all variations:

```snippet
databases: {
    fullPath: { data: "/tmp/file.json" },
    packageRelative: { data: "%my-package/tests/data/file.json" },
    array: {
        data: [ "%my-other-package/tests/data/file1.json", "%my-other-package/tests/data/file2.json"]
    },
    withCustomOptions: {
        dbOptions: {
            autoCompaction: true
        }
    },
    withCustomOptionsAndData: {
        data: "%my-package/tests/data/file.json",
        dbOptions: {
            autoCompaction: true
        }
    },
    empty: {} // Will be created, but without any data
}
```

## Component Invokers

### `{that}.cleanup()`

* Returns: A `Promise` that will be resolved once cleanup is complete (the `onCleanupComplete` event will also be
  fired).

This invoker is called when the `onCleanup` event is fired, which indicates that it is time to remove any existing
data.  This grade provides only a stub, implementations are expected to override it with their own invoker.

### `{that}.initDbs()`

* Returns: A `Promise` that will be resolved once all databases have been initialized.

Initialize all of the databases configured in `options.databases` (see above).  The approach used varies depending on
whether we are working with filesystem or in-memory storage.  The base package provides only a stub which must be
overriden with another invoker.

### `{that}.middleware(request, response, next)`

* `request`: An object representing the individual user's request.  See [the `fluid-express`
  documentation](https://github.com/fluid-project/fluid-express/blob/master/docs/express.md#the-express-request-object) for
  details.
* `response`: The response object, which can be used to send information to the requesting user.  See [the
  `fluid-express`
  documentation](https://github.com/fluid-project/fluid-express/blob/master/docs/express.md#the-express-response-object)
  for details.
* `next`: The next Express middleware or router function in the chain.  See [the `fluid-express` documentation for
  details](https://github.com/fluid-project/fluid-express/blob/master/docs/middleware.md#what-is-middleware).
* Returns: Nothing.

Fulfills the standard contract for a `fluid.express.middleware` grade.  This invoker is backed by an instance of
express-pouchdb, which handles the actual requests and responses.

## `fluid.pouch.express`

An instance of `fluid.pouch.express.base` which has been configured to store its content on the filesystem.

### Component Options

In addition to the above component options, the `fluid.pouch.express` grade supports the following unique options:

| Option                   | Type       | Description |
| ------------------------ | ---------- | ----------- |
| `dbPath`  | `{String}` | A full or package-relative path to the directory in which database content will be stored.  By default, a subdirectory with this component's ID is created in `os.tmpDir()`, and content is stored there. |

If it does not already exist, this grade will create a directory at `options.dbPath` when it is created.

### Component Invokers

#### `{that}.cleanup()`

* Returns: A `Promise` that will be resolved once cleanup is complete (the `onCleanupComplete` event will also be
  fired).

This invoker is called when the `onCleanup` event is fired, which indicates that it is time to remove any existing
data. Calls each database's `destroyPouch` invoker (see [the Pouch component docs](pouchdb.md) for details).

#### `{that}.initDbs()`

* Returns: A `Promise` that will be resolved once all databases have been initialized.

Initialize all of the databases configured in `options.databases` (see above).

## Using these grades in [Fluid IoC Tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

There are convenience grades and helper functions that make it easier to use `fluid.pouch` in Fluid IoC tests.  Please
see the [testing documentation](tests.md) in this package for details.

## Using these grades directly with a `fluid.express` instance

If you are working with another test framework, you can configure `fluid.pouch` to work with a `fluid.express` instance
as shown in this example:

```javascript
fluid.defaults("my.pouch.server.grade", {
    gradeNames: ["fluid.express"],
    port : "9989",
    components: {
        pouch: {
            type: "fluid.pouch",
            options: {
                databases: {
                    sample:  { data: [ "%my-package/tests/data/sample1.json", "%my-package/tests/data/sample2.json"] },
                    _users:  { data: "%my-other-package/tests/data/users.json"}
                }
            }
        }
    }
});

my.pouch.server.grade();
```
