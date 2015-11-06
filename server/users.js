var MongoClient = require( 'mongodb' ).MongoClient,
    assert = require( 'assert' ),
    ObjectId = require( 'mongodb' ).ObjectID,
    logger = require( './logger.js' ),
    conf = require( '../config.json' ),
    url = conf.mongodb.url,
    collection = conf.mongodb.collections.user;

MongoClient.connect( url, function ( err, db ) {
    assert.equal( null, err );

    db.collection( collection ).createIndex( {
        "uid": 1
    }, {
        unique: true
    } )
} );

module.exports = {
    get: function ( uid, callback ) {
        MongoClient.connect( url, function ( err, db ) {
            assert.equal( null, err );

            assert.equal( null, err );
            db.collection( collection ).findOne( {
                    'uid': uid
                },
                function ( err, result ) {
                    callback( err, result );
                }
            );
        } );
    },
    add: function ( uid, name, group, callback ) {
        MongoClient.connect( url, function ( err, db ) {
            assert.equal( null, err );

            var user = {
                "uid": uid,
                "name": name,
                "group": group
            };

            db.collection( collection ).insertOne(
                user,
                function ( err, result ) {
                    if ( err ) {
                        logger.verbose( 'user already added', {
                            uid: uid
                        } );
                    } else {
                        assert.equal( err, null );
                        logger.verbose( 'added a user', {
                            uid: uid
                        } );
                        callback( result );
                    }
                    db.close();
                }
            );
        } );
    }
}