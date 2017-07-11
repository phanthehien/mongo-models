'use strict';
const Async = require('async');
const Code = require('code');
const Config = require('./config');
const Joi = require('joi');
const Lab = require('lab');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
const stub = {
    mongodb: {}
};
const MongoModels = Proxyquire('../index', {
    mongodb: stub.mongodb
});


lab.experiment('MongoModels DB Connection', () => {

    lab.test('it connects and disconnects the database by Promise', () => {

        return MongoModels.connect(Config.mongodb.uri, Config.mongodb.options).then((db) => {
            Code.expect(db).to.be.an.object();
            Code.expect(MongoModels.db.serverConfig.isConnected()).to.equal(true);
            return MongoModels.disconnect().then(() => {
                Code.expect(MongoModels.db.serverConfig.isConnected()).to.equal(false);
            });
        });
    });


    lab.test('it returns an error when the db connection fails', () => {

        const realMongoClient = stub.mongodb.MongoClient;

        stub.mongodb.MongoClient = {
            connect: function (uri, settings, callback) {

                callback(new Error('mongodb is gone'));
            }
        };

        return MongoModels
            .connect(Config.mongodb.uri, Config.mongodb.options)
            .catch((err) => {
                Code.expect(err).to.be.an.object();
                stub.mongodb.MongoClient = realMongoClient;
            });
    });
});


lab.experiment('MongoModels Validation', () => {

    lab.test('it returns the Joi validation results of a SubClass', () => {

        const SubModel = class extends MongoModels {};

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        Code.expect(SubModel.validate()).to.be.an.object();
    });


    lab.test('it returns the Joi validation results of a SubClass instance', () => {

        const SubModel = class extends MongoModels {};

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        const myModel = new SubModel({ name: 'Stimpy' });
        Code.expect(myModel.validate()).to.be.an.object();
    });
});


lab.experiment('MongoModels Result Factory', () => {

    let SubModel;


    lab.before(() => {

        SubModel = class extends MongoModels {};
    });


    lab.test('it returns early when an error is present', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            done();
        };

        SubModel.resultFactory(callback, new Error('it went boom'), undefined);
    });


    lab.test('it returns an instance for a single document result', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.instanceOf(SubModel);

            done();
        };
        const document = {
            _id: '54321',
            name: 'Stimpy'
        };

        SubModel.resultFactory(callback, undefined, document);
    });


    lab.test('it returns an array of instances for a `writeOpResult` object', (done) => {

        const callback = function (err, docs) {

            Code.expect(err).to.not.exist();
            Code.expect(docs).to.be.an.array();

            docs.forEach((result) => {

                Code.expect(result).to.be.an.instanceOf(SubModel);
            });

            done();
        };
        const docs = {
            ops: [
                { name: 'Ren' },
                { name: 'Stimpy' }
            ]
        };

        SubModel.resultFactory(callback, undefined, docs);
    });


    lab.test('it returns a instance for a `findOpResult` object', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();
            Code.expect(result).to.be.an.instanceOf(SubModel);

            done();
        };
        const result = {
            value: { _id: 'ren', name: 'Ren' }
        };

        SubModel.resultFactory(callback, undefined, result);
    });


    lab.test('it returns undefined for a `findOpResult` object that missed', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.not.exist();

            done();
        };
        const result = {
            value: null
        };

        SubModel.resultFactory(callback, undefined, result);
    });


    lab.test('it does not convert an object into an instance without an _id property', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();
            Code.expect(result).to.not.be.an.instanceOf(SubModel);

            done();
        };
        const document = { name: 'Ren' };

        SubModel.resultFactory(callback, undefined, document);
    });
});


lab.experiment('MongoModels Indexes', () => {

    let SubModel;


    lab.before(() => {

        SubModel = class extends MongoModels {};
        SubModel.collection = 'submodels';

        return MongoModels.connect(Config.mongodb.uri, Config.mongodb.options);
    });


    lab.after(() => {

        return MongoModels.disconnect();
    });


    lab.test('it successfully creates indexes', () => {

        SubModel.createIndexes([{ key: { username: 1 } }]).then((results) => {

            Code.expect(err).to.not.exist();
            Code.expect(results).to.be.an.object();
        });
    });
});


lab.experiment('MongoModels Helpers', () => {

    lab.test('it returns expected results for the fields adapter', () => {

        const fieldsDoc = MongoModels.fieldsAdapter('one -two three');
        Code.expect(fieldsDoc).to.be.an.object();
        Code.expect(fieldsDoc.one).to.equal(true);
        Code.expect(fieldsDoc.two).to.equal(false);
        Code.expect(fieldsDoc.three).to.equal(true);

        const fieldsDoc2 = MongoModels.fieldsAdapter('');
        Code.expect(Object.keys(fieldsDoc2)).to.have.length(0);
    });


    lab.test('it returns expected results for the sort adapter', () => {

        const sortDoc = MongoModels.sortAdapter('one -two three');
        Code.expect(sortDoc).to.be.an.object();
        Code.expect(sortDoc.one).to.equal(1);
        Code.expect(sortDoc.two).to.equal(-1);
        Code.expect(sortDoc.three).to.equal(1);

        const sortDoc2 = MongoModels.sortAdapter('');
        Code.expect(Object.keys(sortDoc2)).to.have.length(0);
    });
});


lab.experiment('MongoModels Paged Find', () => {

    let SubModel;


    lab.beforeEach(() => {

        SubModel = class extends MongoModels {};
        SubModel.collection = 'submodels';

        return MongoModels.connect(Config.mongodb.uri, Config.mongodb.options);
    });


    lab.after(() => {

        return MongoModels.disconnect();
    });

    lab.afterEach((done) => {
        SubModel.deleteMany({}).then(() => done()).catch(() => done());
    });

    lab.test('it returns early when an error occurs', () => {

        const realCount = SubModel.count;
        SubModel.count = function (filter) {
            return Promise.reject(new Error('count failed'));
        };

        const filter = {};
        let fields;
        const limit = 10;
        const page = 1;
        const sort = { _id: -1 };

        return SubModel
            .pagedFindAsync(filter, fields, sort, limit, page)
            .catch((err) => {
                Code.expect(err).to.be.an.object();
                SubModel.count = realCount;
        });
    });


    lab.test('it returns paged results', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel.insertManyAsync(testDocs).then((result) => {
            const filter = {};
            let fields;
            const limit = 10;
            const page = 1;
            const sort = { _id: -1 };

            return SubModel.pagedFindAsync(filter, fields, sort, limit, page).then((docs) => {
                Code.expect(docs).to.be.an.object();
                Code.expect(docs.data).to.be.an.array();
                Code.expect(docs.data.length).to.be.equal(3);
            });
        });
    });

    lab.test('it returns paged results where end item is less than total', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel.insertManyAsync(testDocs).then((result) => {
            const filter = {};
            let fields;
            const limit = 2;
            const page = 1;
            const sort = { _id: -1 };

            return SubModel
                .pagedFindAsync(filter, fields, sort, limit, page)
                .then((docs) => {
                    Code.expect(docs).to.be.an.object();
                    Code.expect(docs.data).to.be.an.array();
                    Code.expect(docs.data.length).to.be.equal(2);
            });
        });
    });


    lab.test('it returns paged results where begin item is less than total', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((results) => {
                Code.expect(results).to.be.an.object();

                const filter = { 'role.special': { $exists: true } };
                let fields;
                const limit = 2;
                const page = 1;
                const sort = { _id: -1 };

                return SubModel
                    .pagedFindAsync(filter, fields, sort, limit, page)
                    .then((docs) => {
                        Code.expect(docs).to.be.an.object();
                        Code.expect(docs.data).to.be.an.array();
                        Code.expect(docs.data.length).to.be.equal(0);
                    });
        });
    });
});


lab.experiment('MongoModels Proxied Methods', () => {

    let SubModel;


    lab.before(() => {

        SubModel = class extends MongoModels {};
        SubModel.collection = 'submodels';

        return MongoModels
            .connect(Config.mongodb.uri, Config.mongodb.options)
            .catch(err => console.log('There is error', err));
    });


    lab.after(() => {

        return MongoModels
            .disconnect()
            .catch(err => console.log('There is error when disconnect', err));
    });


    lab.afterEach((done) => {
        SubModel.deleteMany({}).then(() => done()).catch(() => done());
    });


    lab.test('it inserts data and returns the results', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((docs) => {
                Code.expect(docs).to.be.an.object();
                Code.expect(docs.insertedIds).to.be.an.array();
                Code.expect(docs.insertedIds.length).to.equal(3);
            });
    });

    lab.test('it inserts one document and returns the result Async', () => {

        const testDoc = { name: 'Horse' };

        return SubModel
            .insertOneAsync(testDoc)
            .then((docs) => {
                Code.expect(docs.insertedCount).to.equal(1);
            });
    });

    lab.test('it inserts many documents and returns the results Async', () => {

        const testDocs = [
            { name: 'Toast' },
            { name: 'Space' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((docs) => {
                Code.expect(docs.insertedCount).to.equal(2);
            });
    });

    lab.test('it updates a document and returns the results Async', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel.insertManyAsync(testDocs).then((results) => {
            const filter = {
                _id: results.insertedIds[0]
            };
            const update = {
                $set: { isCool: true }
            };

            return SubModel
                .updateOneAsync(filter, update)
                .then((result) => {
                    Code.expect(result.modifiedCount).to.equal(1);
                });
        });
    });

    lab.test('it updates a document and returns the results (with options)', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((results) => {
                const filter = {
                    _id: results.insertedIds[0]
                };
                const update = {
                    $set: { isCool: true }
                };
                const options = { upsert: true };
                return SubModel
                    .updateOneAsync(filter, update, options)
                    .then((result) => {
                        Code.expect(result).to.be.an.object();
                        Code.expect(result.modifiedCount).to.equal(1);
                    });
            });
    });


    lab.test('it returns an error when updateOne fails', () => {

        const testDoc = { name: 'Ren' };
        return SubModel.insertOneAsync(testDoc).then((results) => {
            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {
                return {
                    updateOne: function (filter, update, options) {
                        return Promise.reject(new Error('Whoops!'));
                    }
                };
            };

            const filter = {};
            const update = { $set: { isCool: true } };

            return SubModel.updateOneAsync(filter, update).catch((err) => {
                Code.expect(err).to.exist();
                MongoModels.db.collection = realCollection;
            });
        });

    });

    lab.test('it updates many documents and returns the results Async', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((result) => {
                const filter = {};
                const update = { $set: { isCool: true } };

                return SubModel
                    .updateManyAsync(filter, update)
                    .then((result) => {
                        Code.expect(result.modifiedCount).to.equal(3);
                    });
            });
    });

    lab.test('it updates many documents and returns the results (with options)', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then(() => {
                const filter = {};
                const update = { $set: { isCool: true } };
                const options = { upsert: true };

                return SubModel.updateManyAsync(filter, update, options).then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.modifiedCount).to.equal(3);
                });
            });
    });


    lab.test('it returns an error when updateMany fails', () => {

        const testDoc = { name: 'Ren' };
        return SubModel
            .insertOneAsync(testDoc)
            .then((result) => {
                const realCollection = MongoModels.db.collection;
                MongoModels.db.collection = function () {

                    return {
                        updateMany: function (filter, update, options) {
                            return Promise.reject(new Error('Whoops!'));
                        }
                    };
                };

                const filter = {};
                const update = { $set: { isCool: true } };

                return SubModel.updateManyAsync(filter, update).catch((err) => {
                    Code.expect(err).to.exist();
                    MongoModels.db.collection = realCollection;
                });
            });
    });


    lab.test('it returns aggregate results from a collection', (done) => {

        const testDocs = [
            { name: 'Ren', group: 'Friend', count: 100 },
            { name: 'Stimpy', group: 'Friend', count: 10 },
            { name: 'Yak', group: 'Foe', count: 430 }
        ];

        SubModel
            .insertManyAsync(testDocs)
            .then(() => {
                const pipeline = [
                    { $match: {} },
                    { $group: { _id: '$group', total: { $sum: '$count' } } },
                    { $sort: { total: -1 } }
                ];

                return SubModel.aggregate(pipeline, (err, results) => {
                    Code.expect(err).to.not.exist();
                    Code.expect(results[0].total).to.equal(430);
                    Code.expect(results[1].total).to.equal(110);
                    done()
                }).catch(err => {
                    console.log('Error or aggregate', err);
                    done();
                });
        });
    });

    lab.test('it returns aggregate results from a collection Async', () => {

        const testDocs = [
            { name: 'Ren', group: 'Friend', count: 100 },
            { name: 'Stimpy', group: 'Friend', count: 10 },
            { name: 'Yak', group: 'Foe', count: 430 }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then(() => {
                const pipeline = [
                    { $match: {} },
                    { $group: { _id: '$group', total: { $sum: '$count' } } },
                    { $sort: { total: -1 } }
                ];

                return SubModel
                    .aggregateAsync(pipeline)
                    .then((results) => {
                        Code.expect(results[0].total).to.equal(430);
                        Code.expect(results[1].total).to.equal(110);
                    }).catch(err => {
                        console.log('Error or aggregate', err);
                    });
            });
    });


    lab.test('it returns a collection count', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel.insertManyAsync(testDocs).then((results) => {
            return SubModel.count({}).then((result) => {
                Code.expect(result).to.be.a.number();
                Code.expect(result).to.equal(3);
            });
        });
    });


    lab.test('it returns distinct results from a collection', () => {
        const testDocs = [
            { name: 'Ren', group: 'Friend' },
            { name: 'Stimpy', group: 'Friend' },
            { name: 'Yak', group: 'Foe' }
        ];

        return SubModel.insertManyAsync(testDocs).then((docs) => {
            return SubModel.distinct('group').then((values) => {
                Code.expect(values).to.be.an.array();
                Code.expect(values.length).to.equal(2);
            });
        });
    });


    lab.test('it returns a result array', () => {
        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((docs) => {
                return SubModel.find({}).then((docs) => {
                    Code.expect(docs).to.be.an.array();
                    docs.forEach((result) => {
                        Code.expect(result).to.be.an.instanceOf(SubModel);
                    });
                });
            });
    });


    lab.test('it returns a single result', () => {
        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((results) => {
            return SubModel.findOneAsync({}).then((result) => {
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);
            });
        });
    });

    lab.test('it returns a single result via id Async', () => {
        const testDoc = { name: 'Ren' };
        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const id = doc.insertedId;

            return SubModel.findByIdAsync(id)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                })
        });
    });

    lab.test('it returns and error when id casting fails during findById', () => {
        return SubModel.findByIdAsync('NOTVALIDOBJECTID').catch((err) => {
            Code.expect(err).to.exist();
        });
    });


    lab.test('it updates a single document via findByIdAndUpdate', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const id = doc.insertedId;
            const update = { name: 'New Name' };

            return SubModel
                .findByIdAndUpdateAsync(id, update)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });


    lab.test('it returns an error when casting fails during findByIdAndUpdate', () => {

        return SubModel
            .findByIdAndUpdateAsync('NOTVALIDOBJECTID', {})
            .catch((err) => {
                Code.expect(err).to.exist();
            });
    });


    lab.test('it updates a single document via id (with options)', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const id = doc.insertedId;
            const update = { name: 'New Name' };
            const options = { returnOriginal: false };

            return SubModel
                .findByIdAndUpdateAsync(id, update, options)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });


    lab.test('it updates a single document via findOneAndUpdate', () => {

        const testDoc = { name: 'Ren' };

        return SubModel
            .insertOneAsync(testDoc)
            .then((results) => {
                const filter = { name: 'Ren' };
                const update = { name: 'New Name' };

                return SubModel
                    .findOneAndUpdateAsync(filter, update)
                    .then((result) => {
                        Code.expect(err).to.not.exist();
                        Code.expect(result).to.be.an.object();
                        Code.expect(result.value).to.be.an.instanceOf(SubModel);
                });
            });
    });


    lab.test('it updates a single document via findOneAndUpdate (with options)', () => {
        const testDoc = { name: 'Ren' };

        SubModel.insertOneAsync(testDoc).then((doc) => {
            const filter = { name: 'Ren' };
            const update = { name: 'New Name' };
            const options = { returnOriginal: true };

            return SubModel
                .findOneAndUpdateAsync(filter, update, options)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });

    lab.test('it replaces a single document via findOneAndReplaceAsync', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((results) => {
            const filter = { name: 'Ren' };
            const doc = { isCool: true };

            return SubModel
                .findOneAndReplaceAsync(filter, doc)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });


    lab.test('it replaces a single document via findOneAndReplace', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((results) => {
            const filter = { name: 'Ren' };
            const doc = { isCool: true };

            return SubModel
                .findOneAndReplaceAsync(filter, doc)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });


    lab.test('it replaces a single document via findOneAndReplace (with options)', () => {
        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((results) => {
            const filter = { name: 'Ren' };
            const doc = { isCool: true };
            const options = { returnOriginal: true };

            SubModel
                .findOneAndReplaceAsync(filter, doc, options)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.instanceOf(SubModel);
            });
        });
    });

    lab.test('it replaces one document and returns the result Async', () => {
        const testDoc = { name: 'Ren' };
        return SubModel
            .insertOneAsync(testDoc)
            .then((results) => {
                const filter = { name: 'Ren' };
                const doc = { isCool: true };

                return SubModel.replaceOneAsync(filter, doc).then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.modifiedCount).to.equal(1);
                });
            });

    });

    lab.test('it replaces one document and returns the result', () => {
        const testDoc = { name: 'Ren' };

        return SubModel
            .insertOneAsync(testDoc)
            .then((results) => {
                const filter = { name: 'Ren' };
                const doc = { isCool: true };

                return SubModel
                    .replaceOneAsync(filter, doc)
                    .then((result) => {
                        Code.expect(result.result).to.be.an.object();
                        Code.expect(result.modifiedCount).to.equal(1);
                        Code.expect(result).to.be.an.object();
                });
            });

    });


    lab.test('it replaces one document and returns the result (with options)', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((result) => {
            const filter = { name: 'Ren' };
            const doc = { isCool: true };
            const options = { upsert: true };

            return SubModel
                .replaceOneAsync(filter, doc, options)
                .then((result) => {
                    Code.expect(result.result).to.be.an.object();
                    Code.expect(result.modifiedCount).to.equal(1);
                    Code.expect(result).to.be.an.object();
            });
        });
    });


    lab.test('it returns an error when replaceOne fails', () => {

        const testDoc = { name: 'Ren' };

        return SubModel
            .insertOneAsync(testDoc)
            .then((results) => {
                const realCollection = MongoModels.db.collection;
                MongoModels.db.collection = function () {
                    return {
                        replaceOne: function (filter, doc, options) {

                            return Promise.reject(new Error('Whoops!'));
                        }
                    };
                };

                const filter = { name: 'Ren' };
                const doc = { isCool: true };

                return SubModel
                    .replaceOneAsync(filter, doc)
                    .catch((err) => {
                        Code.expect(err).to.exist();
                        MongoModels.db.collection = realCollection;
                });
            });
    });


    lab.test('it deletes a document via findOneAndDelete', () => {
        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const filter = { name: 'Ren' };

            return SubModel
                .findOneAndDeleteAsync(filter)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });

    });


    lab.test('it deletes a document via findByIdAndDelete', () => {
        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const id = doc.insertedId;

            return SubModel
                .findByIdAndDeleteAsync(id)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
                });
        });
    });


    lab.test('it deletes a single document via findByIdAndDelete (with options)', () => {

        const testDoc = { name: 'Ren' };

        return SubModel.insertOneAsync(testDoc).then((doc) => {
            const id = doc.insertedId;
            const options = {
                projection: {
                    name: 1
                }
            };

            return SubModel
                .findByIdAndDeleteAsync(id, options)
                .then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.value).to.be.an.object();
            });
        });
    });


    lab.test('it returns an error when id casting fails during findByIdAndDelete', () => {

        return SubModel.findByIdAndDeleteAsync('NOTVALIDOBJECTID').catch((err) => {
            Code.expect(err).to.exist();
        });
    });

    lab.test('it deletes one document via deleteOne Async', () => {
        const testDoc = { name: 'Ren' };
        return SubModel.insertOneAsync(testDoc).then((record) => {
            const _id = record.ops[0]._id;
            return SubModel
                .deleteOneAsync({ _id })
                .then((result) => {
                    Code.expect(result.deletedCount).to.equal(1);
                });
        });
    });

    lab.test('it deletes one document via deleteOne', () => {
        const testDoc = { name: 'Ren' };

        return SubModel
            .insertOneAsync(testDoc)
            .then((doc) => {
                return SubModel
                    .deleteOneAsync({})
                    .then((result) => {
                        Code.expect(result).to.be.an.object();
                        Code.expect(result.deletedCount).to.equal(1);
                    });
            });
    });


    lab.test('it returns an error when deleteOne fails', () => {
        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((result) => {
                const realCollection = MongoModels.db.collection;
                MongoModels.db.collection = function () {
                    return {
                        deleteOne: function (filter) {
                            return Promise.reject(new Error('Whoops!'));
                        }
                    };
                };

                return SubModel.deleteOneAsync({}).catch((err) => {
                    Code.expect(err).to.exist();
                    MongoModels.db.collection = realCollection;
                });
            });
    });

    lab.test('it deletes multiple documents and returns the count via deleteMany Async', () => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' }
        ];

        return SubModel.insertManyAsync(testDocs).then((insertResult) => {
            return SubModel.deleteMany({}).then((result) => {
                Code.expect(result.deletedCount).to.equal(2);
            });
        });
    });

    lab.test('it deletes multiple documents and returns the count via deleteMany', () => {
        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((doc) => {
                SubModel.deleteMany({}).then((result) => {
                    Code.expect(result).to.be.an.object();
                    Code.expect(result.deletedCount).to.equal(2);
                });
            });

    });


    lab.test('it returns an error when deleteMany fails', () => {
        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' }
        ];

        return SubModel
            .insertManyAsync(testDocs)
            .then((result) => {
                const realCollection = MongoModels.db.collection;
                MongoModels.db.collection = function () {
                    return {
                        deleteMany: function (filter) {
                            return Promise.reject(new Error('Whoops!'));
                        }
                    };
                };

                SubModel
                    .deleteMany({})
                    .catch((err) => {
                        Code.expect(err).to.exist();
                        MongoModels.db.collection = realCollection;
                });
            });
    });
});
