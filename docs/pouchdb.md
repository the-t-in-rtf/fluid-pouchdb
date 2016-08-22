# `gpii.pouch`

A Fluid component that wraps a PouchDB instance and exposes select methods from the underlying object.

# Component Events

| Event                        | Description |
| ---------------------------- | ----------- |
| `onAllDocsComplete`          | Fired when a call to `{that}.allDocs` (see below) is successfully completed. |
| `onBulkDocsComplete`         | Fired when a call to `{that}.bulkDocs` (see below) is successfully completed. |
| `onBulkGetComplete`          | Fired when a call to `{that}.bulkGet` (see below) is successfully completed. |
| `onCompactComplete`          | Fired when a call to `{that}.compact` (see below) is successfully completed. |
| `onDestroyPouchComplete`     | Fired when a call to `{that}.destroyPouch` (see below) is successfully completed. |
| `onError`                    | Fired when an error occurs. |
| `onGetComplete`              | Fired when a call to `{that}.get` (see below) is successfully completed. |
| `onGetAttachmentComplete`    | Fired when a call to `{that}.getAttachment` (see below) is successfully completed. |
| `onInfoComplete`             | Fired when a call to `{that}.info` (see below) is successfully completed. |
| `onPostComplete`             | Fired when a call to `{that}.post` (see below) is successfully completed. |
| `onPutComplete`              | Fired when a call to `{that}.put` (see below) is successfully completed. |
| `onPutAttachmentComplete`    | Fired when a call to `{that}.putAttachment` (see below) is successfully completed. |
| `onQueryComplete`            | Fired when a call to `{that}.query` (see below) is successfully completed. |
| `onRemoveComplete`           | Fired when a call to `{that}.remove` (see below) is successfully completed. |
| `onRemoveAttachmentComplete` | Fired when a call to `{that}.removeAttachment` (see below) is successfully completed. |
| `onViewCleanupComplete`      | Fired when a call to `{that}.viewCleanup` (see below) is successfully completed. |


# Component Options

| Option                      | Type        | Description |
| --------------------------- | ----------- | ----------- |
| `dbOptions`                 | `{Object}`  | The options to use when creating this database.  See [the PouchDB documentation](https://pouchdb.com/api.html#create_database) for supported options. |
| `dbOptions.name` (required) | `{String}`  | The name of the database. |


# Component Invokers

#`{that}.allDocs([options])`
* `options {Object}`: The options to control which records are returned.
* Returns: A `Promise` that will be resolved once the database has been initialized.

Return the full list of documents in the database, optionally filtered using `options`.

Check the [Pouchdb `allDocs` documentation](https://pouchdb.com/api.html#batch_fetch) for more details.


#`{that}.bulkDocs(docs, [options])`

Create or update multiple documents at once.  You will need to have valid `_id` and `_rev` values for each existing
document you wish to update.

Check the [PouchDB `bulkDocs` docs](https://pouchdb.com/api.html#batch_create) for more details.


#`{that}.bulkGet(options)`

Retrieve a set of full documents based on `options` like the following:

```
{
    docs: [ {_id: "foo"}, {_id: "bar", _rev: "12345" }]
}
```

Check the [PouchDB `bulkGet` docs](https://pouchdb.com/api.html#bulk_get) for more details.


#`{that}.compact([options])`

Compact the database, removing deleted data and older revisions.  This method is not tested and is used at your own
risk.

Check the [PouchDB `compact` docs](https://pouchdb.com/api.html#compaction) for more details.


#`{that}.destroyPouch([options])`

Destroy the underlying PouchDB instance.  The underlying method in the documentation is called `destroy`, we have to use
a variation on the name to avoid the existing `destroy` invoker provided by every component.

Check the [PouchDB `destroy` docs](https://pouchdb.com/api.html#delete_database) for more details.


#`{that}.get(docId, [options])`

Retrieve the document whose ID matches `docId`.

Check the [PouchDB `get` docs](https://pouchdb.com/api.html#fetch_document) for more details.


#`{that}.getAttachment(docId, attachmentId, [options])`

Retrieve an attachment from `docId` whose id matches `attachmentId`.  This method is not tested and is used at your own
risk.

Check the [PouchDB `getAttachment` docs](https://pouchdb.com/api.html#get_attachment) for more details.


#`{that}.info()`

Get information about the current database, including the number of records.

Check the [PouchDB `info` docs](https://pouchdb.com/api.html#database_information) for more details.


#`{that}.post(doc, [options])`

POST a new document `doc`. This may (but does not have to) contain an `_id` variable.

Check the [PouchDB `post` docs](https://pouchdb.com/api.html#create_document) for more details.


#`{that}.put(doc, [docId], [docRev], [options])`

PUT a new document or an update to an existing document.

Check the [PouchDB `put` docs](https://pouchdb.com/api.html#create_document) for more details.


#`{that}.putAttachment(docId, attachmentId, [rev], attachment, type)`

Create or update an attachment.

Check the [PouchDB `putAttachment` docs](https://pouchdb.com/api.html#save_attachment) for more details.  This method is
not tested and is used at your own risk.


#`{that}.query(fun, [options])`

Execute the supplied `fun` function and return the results.  Intended to be used with a map/reduce function.

Check the [PouchDB `query` docs](https://pouchdb.com/api.html#query_database) for more details.


#`{that}.remove(doc, [options])`

Remove the document `doc` from the database.  `doc` must contain a valid `_id` and `_rev`.

Check the [PouchDB `remove` docs](https://pouchdb.com/api.html#delete_document) for more details.


#`{that}.removeAttachment(docId, attachmentId, rev)`

Remove an existing attachment.

Check the [PouchDB `removeAttachment` docs](https://pouchdb.com/api.html#delete_attachment) for more details.  This
method is not tested and is used at your own risk.


#`{that}.viewCleanup()`

Clean up any stale map/reduce indexes.  This method is not tested and is used at your own risk.

Check the [PouchDB X docs](https://pouchdb.com/api.html#view_cleanup) for more details.
