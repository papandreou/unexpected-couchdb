var BeanBag = require('beanbag');
var express = require('express');
var expect = require('unexpected');

describe('unexpected-mock-couchdb', function () {
    expect.installPlugin(require('../lib/unexpectedMockCouchdb'));
    expect.installPlugin(require('unexpected-http'));
    expect.installPlugin(require('unexpected-express'));

    var app = express();
    var couchdb = new BeanBag({
        url: 'http://localhost:5984/'
    });

    app.get('/:database', function (req, res) {
        couchdb.request({
            path: '/' + req.params.database
        }, function (err, result, body) {
            if (err) {
                if (err.statusCode === 404) {
                    // workaround BeanBag to return correct body
                    body = {
                        error: 'not_found',
                        reason: 'no_db_file'
                    };
                }

                return res.status(err.statusCode).send(body);
            }

            res.status(200).send(body);
        });
    });

    it('should return 404 if the database is not present', function () {
        return expect(app, 'with couchdb mocked out', {}, 'to yield exchange', {
            request: {
                url: '/nonexistent'
            },
            response: {
                statusCode: 404,
                body: {
                    error: 'not_found',
                    reason: 'no_db_file'
                }
            }
        });
    });

    it('should return 200 if the database exists', function () {
        return expect(app, 'with couchdb mocked out', {
            foo: {}
        }, 'to yield exchange', {
            request: {
                url: '/foo'
            },
            response: {
                statusCode: 200
            }
        });
    });

    it('should return the correct count of documents', function () {
        var documents = [{}, {}];

        return expect(app, 'with couchdb mocked out', {
            database: {
                docs: documents
            }
        }, 'to yield exchange', {
            request: {
                url: '/database'
            },
            response: {
                statusCode: 200,
                body: {
                    db_name: 'database',
                    doc_count: documents.length
                }
            }
        });
    });

    describe('documentation', function () {
        it('should return the contents of some_database including the documents', function () {
            return expect('GET /some_database/_all_docs?include_docs=true', 'with couchdb mocked out', {
                some_database: {
                    docs: [
                        {
                            _id: 'myDocument',
                            foo: 'bar',
                            baz: 1
                        }
                    ]
                }
            }, 'to yield response', {
                statusCode: 200,
                body: {
                    total_rows: 1,
                    rows: [
                        {
                            id: 'myDocument',
                            doc: {
                                _id: 'myDocument',
                                foo: 'bar',
                                baz: 1
                            }
                        }
                    ]
                }
            });
        });
    });
});
