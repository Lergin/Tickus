var express = require( 'express' ),
    app = express(),
    server = require( 'http' ).createServer( app ),
    io = require( 'socket.io' ).listen( server ),
    conf = require( './config.json' );

var MongoClient = require( 'mongodb' ).MongoClient;
var assert = require( 'assert' );
var ObjectId = require( 'mongodb' ).ObjectID;

var url = conf.mongodb.url;
var ticketCollection = conf.mongodb.collection;

var ticket = {
    'date': new Date(),
    'author': {
        'name': 'Malte',
        'uid': '29403'
    },
    'status': 'wip',
    'title': 'TITEL!!!',
    'tags': [
        'Forum',
        '@Admins',
        'WTF its working'
    ],
    'comments': [ {
        'author': {
            'name': 'Malte',
            'uid': '29403'
        },
        'date': new Date( "2014-11-01T00:00:00Z" ),
        'content': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }, {
        'author': {
            'name': 'Malte',
            'uid': '29403'
        },
        'date': new Date( "2014-10-03T00:00:00Z" ),
        'content': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }, {
        'author': {
            'name': 'Malte',
            'uid': '29403'
        },
        'date': new Date( "2014-10-01T00:00:00Z" ),
        'content': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    } ],
    'lastModified': new Date()
};


var updateTicket = function ( id, key, value, callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        var newData = {};
        newData[ key ] = value;

        db.collection( ticketCollection ).updateOne( {
            "_id": ObjectId( id )
        }, {
            $set: newData,
            $currentDate: {
                "lastModified": true
            }
        }, function ( err, results ) {
            assert.equal( err, null );
            log( 'updatet ' + key + ' of ' + id + ' to ' + value );
            callback( results )
            db.close();
        } );
    } );
};

var createTicket = function ( ticket, callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        db.collection( ticketCollection ).insertOne(
            ticket,
            function ( err, result ) {
                assert.equal( err, null );
                log( 'added a ticket' );
                callback( result );
            }
        );
    } );
};

var createComment = function ( id, comment, callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        db.collection( ticketCollection ).updateOne( {
            "_id": ObjectId( id )
        }, {
            $push: {
                "comments": comment
            },
            $currentDate: {
                "lastModified": true
            }
        }, function ( err, results ) {
            assert.equal( err, null );
            log( 'created Comment for ' + id );
            callback( results )
            db.close();
        } );
    } );
}

var findAllComments = function ( callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );
        var cursor = db.collection( ticketCollection ).find();
        cursor.each( function ( err, doc ) {
            assert.equal( err, null );
            if ( doc != null ) {
                callback( doc, null );
            } else {
                callback( null, err );
            }
        } );
    } );
};

var changeStatus = function( id, status, callback){
    updateTicket( id, 'status', status, callback);
}

var addTag = function( id, tag, callback){
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        var newData = {};
        newData[ "tags" ] = tag;

        db.collection( ticketCollection ).updateOne( {
            "_id": ObjectId( id )
        }, {
            $addToSet: newData,
            $currentDate: {
                "lastModified": true
            }
        }, function ( err, results ) {
            assert.equal( err, null );
            log('added Tag ' + tag + ' to ' + id);
            callback( results )
            db.close();
        } );
    } );
}
var removeTag = function( id, tag, callback){
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        var newData = {};
        newData[ "tags" ] = tag;

        db.collection( ticketCollection ).updateOne( {
            "_id": ObjectId( id )
        }, {
            $pull: newData,
            $currentDate: {
                "lastModified": true
            }
        }, function ( err, results ) {
            assert.equal( err, null );
            log('removed Tag ' + tag + ' to ' + id);
            callback( results )
            db.close();
        } );
    } );
}

//createTicket( ticket, function () {} );

var comment = {
    author: {
        name: 'Malte',
        uid: '1'
    },
    content: "test 123 test",
    'date': new Date()
}


server.listen( conf.port );



app.use( express.static( __dirname + '/dev' ) );

app.get( '/', function ( req, res ) {
    res.sendfile( __dirname + '/dev/index.html' );
} );

app.get( /(wip|todo|waiting|all|ready|ticket)/ , function ( req, res ) {
    res.sendfile( __dirname + '/dev/index.html' );
} );


/**
 * log - logs something to the console
 *
 * @param  {string} message string that shoud be loged
 * @param  {string} type    type aka prefix
 */
function log( message, type ) {
    console.log( '[' + ( type || 'I' ) + '] ' + new Date().toTimeString().substring( 0, 8 ) + ' ' + message );
}

io.sockets.on( 'connection', function ( socket ) {
    socket.on( 'new comment', function ( data ) {
        createComment( data.id , data.comment , function () {
            io.sockets.emit( 'new comment', data);
        } );
    } );

    socket.on( 'add tag', function ( data ) {
        addTag( data.id , data.tag , function () {
            io.sockets.emit( 'add tag', data);
        } );
    } );

    socket.on( 'remove tag', function ( data ) {
        removeTag( data.id , data.tag , function () {
            io.sockets.emit( 'remove tag', data);
        } );
    } );

    socket.on( 'change status', function ( data ) {
        changeStatus( data.id , data.status , function () {
            io.sockets.emit( 'change status', data);
        } );
    } );

    log( "new Connection" );

    findAllComments( function (data) {
        if(data != null){
            socket.emit( 'ticket', data );
        }
    } );
} );

log( 'Server is runing at http://localhost:' + conf.port + '/' );
