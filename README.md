# `gpii-pouchdb`

This package allows you to test integration with CouchDB using [PouchDB](https://github.com/pouchdb/pouchdb)
and [express-pouchdb](https://github.com/pouchdb/express-pouchdb).  You can use the same data, design documents, and
REST calls as you would with CouchDB.

Although you can use the [`gpii.pouch` component](docs/pouch-component.md) on its own, a [`testEnvironment`](docs/tests.md)
is provided for use in writing [Fluid IoC tests](http://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

See the [`gpii.pouch`](docs/pouch-component.md) or [testing documentation](docs/tests.md) for usage instructions.

Please note, this package is only intended for use in manual and automated testing.  It should never be used in any kind
of production capacity.  Also, although PouchDB can run in a browser, this package cannot.