'use strict';
const Async = require('async');
const Hoek = require('hoek');
const Joi = require('joi');
const Mongodb = require('mongodb');


class MongoModels {
    constructor(attrs) {

        Object.assign(this, attrs);
    }

    static connect(uri, options) {

        return new Promise(function (resolve, reject) {

            Mongodb.MongoClient.connect(uri, options, (err, db) => {

                if (err) {
                    return reject(err);
                }
                MongoModels.db = db;
                return resolve(db);
            });
        });
    }

    static disconnect() {
        return MongoModels.db.close();
    }


    static createIndexes() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.createIndexes.apply(collection, args);
    }

    static validate(input) {

        return Joi.validate(input, this.schema);
    }

    validate() {

        return Joi.validate(this, this.constructor.schema);
    }


    static resultFactory() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const next = args.shift();
        const err = args.shift();
        let result = args.shift();

        if (err) {
            args.unshift(result);
            args.unshift(err);
            return next.apply(undefined, args);
        }

        const self = this;

        if (Object.prototype.toString.call(result) === '[object Array]') {
            result.forEach((item, index) => {

                result[index] = new self(item);
            });
        }

        if (Object.prototype.toString.call(result) === '[object Object]') {
            if (result.hasOwnProperty('value') && !result.hasOwnProperty('_id')) {
                if (result.value) {
                    result = new this(result.value);
                }
                else {
                    result = undefined;
                }
            }
            else if (result.hasOwnProperty('ops')) {
                result.ops.forEach((item, index) => {

                    result.ops[index] = new self(item);
                });

                result = result.ops;
            }
            else if (result.hasOwnProperty('_id')) {
                result = new this(result);
            }
        }

        args.unshift(result);
        args.unshift(err);
        next.apply(undefined, args);
    }

    static pagedFindAsync(filter, fields, sort, limit, page) {

        const self = this;
        return new Promise(function (resolve, reject) {
            const output = {
                data: undefined,
                pages: {
                    current: page,
                    prev: 0,
                    hasPrev: false,
                    next: 0,
                    hasNext: false,
                    total: 0
                },
                items: {
                    limit,
                    begin: ((page * limit) - limit) + 1,
                    end: page * limit,
                    total: 0
                }
            };

            fields = self.fieldsAdapter(fields);
            sort = self.sortAdapter(sort);

            const options = {
                limit,
                skip: (page - 1) * limit,
                sort
            };

            Promise.all([
                self.count(filter),
                self.find(filter, fields, options)
            ]).then((results) => {
                output.items.total = results[0];
                output.data = results[1];

                // paging calculations
                output.pages.total = Math.ceil(output.items.total / limit);
                output.pages.next = output.pages.current + 1;
                output.pages.hasNext = output.pages.next <= output.pages.total;
                output.pages.prev = output.pages.current - 1;
                output.pages.hasPrev = output.pages.prev !== 0;
                if (output.items.begin > output.items.total) {
                    output.items.begin = output.items.total;
                }
                if (output.items.end > output.items.total) {
                    output.items.end = output.items.total;
                }

                return resolve(output);
            }).catch((err) => {
                if (err) {
                    return reject(err);
                }
            });
        });
    }

    static fieldsAdapter(fields) {

        if (Object.prototype.toString.call(fields) === '[object String]') {
            const document = {};

            fields = fields.split(/\s+/);
            fields.forEach((field) => {

                if (field) {
                    const include = field[0] === '-' ? false : true;
                    if (!include) {
                        field = field.slice(1);
                    }
                    document[field] = include;
                }
            });

            fields = document;
        }

        return fields;
    }


    static sortAdapter(sorts) {

        if (Object.prototype.toString.call(sorts) === '[object String]') {
            const document = {};

            sorts = sorts.split(/\s+/);
            sorts.forEach((sort) => {

                if (sort) {
                    const order = sort[0] === '-' ? -1 : 1;
                    if (order === -1) {
                        sort = sort.slice(1);
                    }
                    document[sort] = order;
                }
            });

            sorts = document;
        }

        return sorts;
    }

    static aggregate() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        collection.aggregate.apply(collection, args);
    }

    static aggregateAsync() {
        const self = this;
        const methodArgs = arguments;
        return new Promise(function (resolve, reject) {
                const args = new Array(methodArgs.length);
                for (let i = 0; i < args.length; ++i) {
                    args[i] = methodArgs[i];
                }

                args.push((err, results) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(results);
                });

                const collection = MongoModels.db.collection(self.collection);
                collection.aggregate.apply(collection, args);
        });
    }


    static count() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.count.apply(collection, args);
    }


    static distinct() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.distinct.apply(collection, args);
    }


    static find() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.find.apply(collection, args).toArray();
    }

    static findOneAsync() {
        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);

        return collection.findOne.apply(collection, args);
    }

    static findOneAndUpdateAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const filter = args.shift();
        const doc = args.shift();
        const options = Hoek.applyToDefaults({ returnOriginal: false }, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        return collection.findOneAndUpdate.apply(collection, args);
    }

    static findOneAndDeleteAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);

        return collection.findOneAndDelete.apply(collection, args);
    }

    static findOneAndReplaceAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const filter = args.shift();
        const doc = args.shift();
        const options = Hoek.applyToDefaults({ returnOriginal: false }, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        return collection.findOneAndReplace.apply(collection, args);
    }

    static findByIdAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const id = args.shift();
        let filter;

        try {
            filter = { _id: this._idClass(id) };
        }
        catch (exception) {
            return Promise.reject(exception);
        }

        args.unshift(filter);
        return collection.findOne.apply(collection, args);
    }

    static findByIdAndUpdateAsync() {
        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const id = args.shift();
        const update = args.shift();
        const options = Hoek.applyToDefaults({ returnOriginal: false }, args.pop() || {});
        let filter;

        try {
            filter = { _id: this._idClass(id) };
        }
        catch (exception) {
            return Promise.reject(exception);
        }

        return collection.findOneAndUpdate(filter, update, options);
    }

    static findByIdAndDeleteAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const id = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});
        let filter;

        try {
            filter = { _id: this._idClass(id) };
        }
        catch (exception) {
            return Promise.reject(exception);
        }

        return collection.findOneAndDelete(filter, options);
    }

    static insertManyAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.insertMany.apply(collection, args);
    }

    static insertOneAsync() {
        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        return collection.insertOne.apply(collection, args);
    }

    static updateManyAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const filter = args.shift();
        const update = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(update);
        args.push(options);

        return collection.updateMany.apply(collection, args);
    }

    static updateOneAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const filter = args.shift();
        const update = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(update);
        args.push(options);

        return collection.updateOne.apply(collection, args);
    }

    static replaceOneAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);
        const filter = args.shift();
        const doc = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        return collection.replaceOne.apply(collection, args);
    }

    static deleteOneAsync() {

        const args = new Array(arguments.length);
        for (let i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        const collection = MongoModels.db.collection(this.collection);

        return collection.deleteOne.apply(collection, args);
    }

    static deleteMany() {

        const collection = MongoModels.db.collection(this.collection);
        return collection.deleteMany.apply(collection, arguments);
    }
}

MongoModels._idClass = Mongodb.ObjectID;
MongoModels.ObjectId = MongoModels.ObjectID = Mongodb.ObjectID;


module.exports = MongoModels;
