# `gpii.pouch`

This component is a [`gpii.express.router` instance](https://github.com/GPII/gpii-express/blob/master/docs/router.md)
that is meant to be wired into the root of [a `gpii.express` instance](https://github.com/GPII/gpii-express).


# Using `gpii.pouch` in [Fluid IoC Tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

There are convenience grades and helper functions that make it easier to use `gpii.pouch` in Fluid IoC tests.  Please
see the [testing documentation](tests.md) in this package for details.

# Using `gpii.pouch` directly with `gpii.express` instance

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

For details on the supported data format, see "Component Options" below.

# Component Options

In addition to the options supported by the `gpii.express.router` component, this component has the following unique
options.

| Option                   | Type       | Description |
| ------------------------ | ---------- | ----------- |
| `databases` (required)   | `{Object}` | An object that describes one or more databases to create.  See below for full details. |
| `dbOptions`              | `{Object}` | Options that will be used when constructing each individual database. See [the PouchDB docs](https://pouchdb.com/api.html#create_database) for supported options. ]
| `expressPouchConfig`     | `{Object}` | Options that will be used when constructing the express-pouchdb instance. See [the express-pouchdb docs](https://github.com/pouchdb/express-pouchdb#api) for supported options.|
| `expressPouchConfigPath` | `{String}` | The path to the temporary file where the settings in `expressPouchConfig` will be stored and read by express-pouchdb.  The settings in `expressPouchConfig` will be saved to a file named `pouchdb.conf` in this directory.  Defaults to `os.tmpdir() + "/pouch.conf"`.|

## The `databases` option

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

## Supported data file formats

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

