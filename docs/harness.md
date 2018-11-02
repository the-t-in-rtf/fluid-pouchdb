# `gpii.pouch.harness`

A component which spins up a CouchDB docker container and populates it with data.  Although you will generally use this
in combination with the test environment provided by this package, it can also be used on its own. As an example, the
file `tests/js/launch-test-test-harness.js` included with this package can be used to launch a standalone test instance
of this package for manual QA.

## Component Options

| Option            | Type       | Description |
| ----------------- | ---------- | ----------- |
| `port` (required) | `{Number}` | The port on which the test harness will run. |
| `databases`       | `{Array}`  | A map of databases and data files to provision them with.  See below. |

### The `databases` Option

The harness is provisioned with databases and content based on the contents of `options.databases`

```javascript
var fluid = require("infusion");
var my = fluid.registerNamespace("my");

require("my-package");
require("my-other-package");

fluid.defaults("my.harness", {
    gradeNames: ["gpii.pouch.harness"],
    databases: {
        singleFile: {
            data: "%my-package/tests/data/onePayload.json"
        },
        lotsOfFiles: {
            data: [
                "%my-package/tests/data/onePayload.json",
                "%my-other-package/tests/data/otherPayload.json"
            ]
        },
        empty: {}
    }
});
```

Each file is expected to be a valid payload that can be used with the [CouchDB bulk document
API](http://docs.couchdb.org/en/2.2.0/api/database/bulk-api.html#db-bulk-docs), something like:

```json
{
    "docs": [
        {
            "_id": "id1",
            "key": "value"
        },
        {
            "_id": "id2",
            "other-key": "other value"
        }
    ]
}
```

Even though the harness no longer uses express-pouchdb, you can also use the legacy `options.pouchConfig.databases`
option, although it's recommended that you updated your code, as this option may not be supported in a future release.
