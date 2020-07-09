# `fluid-pouchdb`

This package provides [Fluid
components](http://docs.fluidproject.org/infusion/development/UnderstandingInfusionComponents.html) that wrap
[PouchDB](https://github.com/pouchdb/pouchdb) and [express-pouchdb](https://github.com/pouchdb/express-pouchdb). You can
use the same data, design documents, and REST calls as you would with CouchDB.

For more information, see the documentation:

* [`fluid.pouch`](./docs/pouchdb.md) - A wrapper around individual PouchDB instances.
* [`fluid.pouch.express`](./docs/pouch-express.md) - A wrapper around an instance of express-pouchdb.
* [`fluid.pouch.harness`](./docs/harness.md) - An instance of `fluid.express` with a full-configured `fluid.pouch.express`
  subcomponent wired in.
* [Test fixtures and functions provided by this package.](./docs/tests.md)

## Note:

The browser tests for this package will fail intermittently in IE11. This has been written up and is being tracked at
[https://issues.fluid.net/browse/fluid-2492](https://issues.fluid.net/browse/fluid-2492)
