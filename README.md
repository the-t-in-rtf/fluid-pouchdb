# `gpii-pouchdb`

This package allows you to test integration with CouchDB using [PouchDB](https://github.com/pouchdb/pouchdb)
and [express-pouchdb](https://github.com/pouchdb/express-pouchdb).  You can use the same data, design documents, and
REST calls as you would with CouchDB.

Although you can use the [`gpii.pouch` component](docs/pouch-component.md) on its own, a [`testEnvironment`](docs/tests.md)
is provided for use in writing [Fluid IoC tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

See the [`gpii.pouch.express`](docs/pouch-express.md) or [testing documentation](docs/tests.md) for usage instructions.

# Coming Soon

There will shortly be a browser-compatible component that wraps the underlying PouchDB instances.  See
[GPII-1896](https://issues.gpii.net/browse/GPII-1896) for details.