# `fluid.pouch.harness`

An instance of `fluid.express` which has an instance of `fluid.pouch.express` wired into it.  Provides a working HTTP REST
API equivalent to CouchDB.  Although you will generally use this in combination with the test enviroment above, it can
also be used on its own. As an example, the file `tests/js/launch-test-test-harness.js` included with this package can
be used to launch a standalone test instance of this package for manual QA.

## Component Options

| Option            | Type       | Description |
| ----------------- | ---------- | ----------- |
| `port` (required) | `{Number}` | The port on which the test harness will run. |

## `fluid.pouch.harness.persistent`

An instance of the harness which is designed to persist its data between runs.

### Component Options

In addition to the options for `fluid.pouch.harness`, this grade has the following unique option:

| Option               | Type       | Description |
| -------------------- | ---------- | ----------- |
| `baseDir` (required) | `{String}` | A full or package-relative path to the base directory in which all database content, configuration files, and logs will be stored. |
