# API reference

- [Properties](#properties)
  - [`_idClass`](#_idclass)
  - [`collection`](#collection)
  - [`ObjectId`](#objectid)
  - [`schema`](#schema)
- [Methods](#methods)
  - [`connect(uri, options)`](#connectconfig)
  - [`aggregate(pipeline, [options])`](#aggregatepipeline-options)
  - [`count(filter, [options])`](#countfilter-options)
  - [`createIndexes(indexSpecs, [callback])`](#createindexesindexspecs)
  - [`deleteMany(filter, [options])`](#deletemanyfilter-options)
  - [`deleteOne(filter, [options])`](#deleteonefilter-options)
  - [`disconnect()`](#disconnect)
  - [`distinct(field, [filter])`](#distinctfield-filter)
  - [`fieldsAdapter(fields)`](#fieldsadapterfields)
  - [`find(filter, [options])`](#findfilter-options)
  - [`findById(id, [options])`](#findbyidid-options)
  - [`findByIdAndDelete(id)`](#findbyidanddeleteid)
  - [`findByIdAndUpdate(id, update, [options])`](#findbyidandupdateid-update-options)
  - [`findOne(filter, [options])`](#findonefilter-options)
  - [`findOneAndDelete(filter, [options])`](#findoneanddeletefilter-options)
  - [`findOneAndUpdate(filter, update, [options])`](#findoneandupdatefilter-options)
  - [`insertMany(docs, [options])`](#insertmanydocs-options)
  - [`insertOne(doc, [options])`](#insertonedoc-options)
  - [`pagedFind(filter, fields, sort, limit, page)`](#pagedfindfilter-fields-sort-limit-page)
  - [`replaceOne(filter, doc, [options])`](#replaceonefilter-doc-options)
  - [`sortAdapter(sorts)`](#sortadaptersorts)
  - [`updateMany(filter, update, [options])`](#updatemanyfilter-update-options)
  - [`updateOne(filter, update, [options])`](#updateonefilter-update-options)
  - [`validate()`](#validatecallback)
  - [`validate(input)`](#validateinput)


## Properties

### `_idClass`

The type used to cast `_id` properties. Defaults to
[`MongoDB.ObjectId`](http://docs.mongodb.org/manual/reference/object-id/).

If you wanted to use plain strings for your document `_id` properties you could:

```js
Kitten._idClass = String;
```

When you define a custom `_idClass` property for your model you just need to
pass an `_id` parameter of that type when you create new documents.

```js
const data = {
    _id: 'captain-cute',
    name: 'Captain Cute'
};

Kitten.insert(data, (err, results) => {

    // handle response
});
```

### `collection`

The name of the collection in MongoDB.

```js
Kitten.collection = 'kittens';
```

### `ObjectId`

An alias to `MongoDB.ObjectId`.

### `schema`

A `joi` object schema. See: https://github.com/hapijs/joi

```js
Kitten.schema = Joi.object().keys({
    _id: Joi.string(),
    name: Joi.string().required(),
    email: Joi.string().required()
});
```


## Methods

### `connect(uri, options)`

Connects to a MongoDB server where:

- `uri` - the connection string passed to `MongoClient.connect`.
- `options` - an optional object passed to `MongoClient.connect`.

### `aggregate(pipeline, [options])`

Calculates aggregate values for the data in a collection where:

- `pipeline` - A sequence of data aggregation operations or stages.
- `options` - an options object passed to MongoDB's native
  [`aggregate`](https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/)
  method.

### `count(filter, [options])`

Counts documents matching a `filter` where:

- `filter` - a filter object used to select the documents to count.
- `options` - an options object passed to MongoDB's native
  [`count`](https://docs.mongodb.com/manual/reference/method/db.collection.count/)
  method.

### `createIndexes(indexSpecs, [callback])`

Note: `createIndexes` is called during plugin registration for each model when
the `autoIndex` option is set to `true`.

Creates multiple indexes in the collection where:

- `indexSpecs` - an array of objects containing index specifications to be
  created.

Indexes are defined as a static property on your models like:

```js
Kitten.indexes = [
    { key: { name: 1 } },
    { key: { email: -1 } }
];
```

For details on all the options an index specification may have see:

https://docs.mongodb.org/manual/reference/command/createIndexes/

### `deleteMany(filter, [options])`

Deletes multiple documents and returns the count of deleted documents where:

- `filter` - a filter object used to select the documents to delete.
- `options` - an options object passed to MongoDB's native
  [`deleteMany`](https://docs.mongodb.com/manual/reference/method/db.collection.deleteMany/)
  method.

### `deleteOne(filter, [options])`

Deletes a document and returns the count of deleted documents where:

- `filter` - a filter object used to select the document to delete.
- `options` - an options object passed to MongoDB's native
  [`deleteOne`](https://docs.mongodb.com/manual/reference/method/db.collection.deleteOne/)
  method.

### `disconnect()`

Closes the current db connection.

### `distinct(field, [filter])`

Finds the distinct values for the specified `field`.

- `field` - a string representing the field for which to return distinct values.
- `filter` - an optional filter object used to limit the documents distinct applies to.

### `fieldsAdapter(fields)`

A helper method to create a fields object suitable to use with MongoDB queries
where:

- `fields` - a string with space separated field names. Fields may be prefixed
  with `-` to indicate exclusion instead of inclusion.

Returns a MongoDB friendly fields object.

```js
Kitten.fieldsAdapter('name -email');

// { name: true, email: false }
```

### `find(filter, [options])`

Finds documents where:

- `filter` - a filter object used to select the documents.
- `options` - an options object passed to MongoDB's native
  [`find`](https://docs.mongodb.com/manual/reference/method/db.collection.find/)
  method.

### `findById(id, [options])`

Finds a document by `_id` where:

- `id` - is a string value of the `_id` to find. It will be casted to the type
  of `_idClass`.
- `options` - an options object passed to MongoDB's native
  [`findOne`](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/)
  method.

### `findByIdAndDelete(id)`

Finds a document by `_id`, deletes it and returns it where:

- `id` - is a string value of the `_id` to find. It will be casted to the type
  of `_idClass`.

### `findByIdAndUpdate(id, update, [options])`

Finds a document by `_id`, updates it and returns it where:

- `id` - is a string value of the `_id` to find. It will be casted to the type
  of `_idClass`.
- `update` - an object containing the fields/values to be updated.
- `options` - an optional options object passed to MongoDB's native
  [`findOneAndUpdate`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/)
  method. Defaults to `{ returnOriginal: false }`.

### `findOne(filter, [options])`

Finds one document matching a `filter` where:

- `filter` - a filter object used to select the document.
- `options` - an options object passed to MongoDB's native
  [`findOne`](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/)
  method.

### `findOneAndDelete(filter, [options])`

Finds one document matching a `filter`, deletes it and returns it where:

- `filter` - a filter object used to select the document to delete.
- `options` - an options object passed to MongoDB's native
  [`findOneAndDelete`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndDelete/)
  method.

### `findOneAndUpdate(filter, update, [options])`

Finds one document matching a `filter`, updates it and returns it where:

- `filter` - a filter object used to select the document to update.
- `update` - an object containing the fields/values to be updated.
- `options` - an options object passed to MongoDB's native
  [`findOneAndUpdate`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/)
  method. Defaults to `{ returnOriginal: false }`.

### `insertMany(docs, [options])`

Inserts multiple documents and returns them where:

- `docs` - an array of document objects to insert.
- `options` - an options object passed to MongoDB's native
  [`insertMany`](https://docs.mongodb.com/manual/reference/method/db.collection.insertMany/)
  method.

### `insertOne(doc, [options])`

Inserts a document and returns the new document where:

- `doc` - a document object to insert.
- `options` - an options object passed to MongoDB's native
  [`insertOne`](https://docs.mongodb.com/manual/reference/method/db.collection.insertOne/)
  method.

### `pagedFind(filter, fields, sort, limit, page)`

Finds documents with paginated results where:

- `filter` - a filter object used to select the documents.
- `fields` - indicates which fields should be included in the response (default
  is all). Can be a string with space separated field names.
- `sort` - indicates how to sort documents. Can be a string with space
  separated fields. Fields may be prefixed with `-` to indicate decending sort
  order.
- `limit` - a number indicating how many results should be returned.
- `page` - a number indicating the current page.

### `replaceOne(filter, doc, [options])`

Replaces a document and returns the count of modified documents where:

- `filter` - a filter object used to select the document to replace.
- `doc` - the document that replaces the matching document.
- `options` - an options object passed to MongoDB's native
  [`replaceOne`](https://docs.mongodb.com/manual/reference/method/db.collection.replaceOne/)
  method.

### `sortAdapter(sorts)`

A helper method to create a sort object suitable to use with MongoDB queries
where:

- `sorts` - a string with space separated field names. Fields may be prefixed
  with `-` to indicate decending sort order.

Returns a MongoDB friendly sort object.

```js
Kitten.sortAdapter('name -email');

// { name: 1, email: -1 }
```

### `updateMany(filter, update, [options])`

Updates multiple documents and returns the count of modified documents where:

- `filter` - a filter object used to select the documents to update.
- `update` - the update operations object.
- `options` - an options object passed to MongoDB's native
  [`updateMany`](https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/)
  method.

### `updateOne(filter, update, [options])`

Updates a document and returns the count of modified documents where:

- `filter` - a filter object used to select the document to update.
- `update` - the update operations object.
- `options` - an options object passed to MongoDB's native
  [`updateOne`](https://docs.mongodb.com/manual/reference/method/db.collection.updateOne/)
  method.

### `validate()`

Uses `joi` validation using the static `schema` object property of a model
class to validate the instance data of a model where:

```js
const cc = new Kitten({
    name: 'Captain Cute'
});

cc.validate((err, value) => {

    // handle results
});
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options

### `validate(input)`

Uses `joi` validation using the static `schema` object property of a model
class to validate `input` where:

- `input` - is the object to validate.

```js
const data = {
    name: 'Captain Cute'
};

Kitten.validate(data, (err, value) => {

    // handle results
});
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options
