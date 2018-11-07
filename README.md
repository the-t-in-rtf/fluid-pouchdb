# `gpii-pouchdb`

This package provides [Fluid components](http://docs.fluidproject.org/infusion/development/UnderstandingInfusionComponents.html)
to assist in testing systems that store their data in and make requests against CouchDB. For more information, see the
documentation:

* [`gpii.pouch`](./docs/pouchdb.md) - A wrapper around individual PouchDB instances.
* [`gpii.pouch.harness`](./docs/harness.md) - A [Docker](https://www.docker.com) container running the
  [Apache CouchDB image](https://github.com/apache/couchdb-docker), which can be wired into Fluid IoC Test environments.
* [Test fixtures and functions provided by this package.](./docs/tests.md)

## Note:

The browser tests for this package will fail intermittently in IE11. This has been written up and is being tracked at
[https://issues.gpii.net/browse/GPII-2492](https://issues.gpii.net/browse/GPII-2492)
