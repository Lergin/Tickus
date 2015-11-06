var express = require( 'express' ),
    app = express(),
    server = require( 'http' ).createServer( app ),
    io = require( 'socket.io' ).listen( server ),
    conf = require( './config.json' ),
    MongoClient = require( 'mongodb' ).MongoClient,
    assert = require( 'assert' ),
    ObjectId = require( 'mongodb' ).ObjectID,
    tickets = require( './server/tickets.js' ),
    logger = require( './server/logger.js' );

var url = conf.mongodb.url;
var ticketCollection = conf.mongodb.collections.tickets;
var userCollection = conf.mongodb.collections.user;

var getUser = function ( uid, callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        assert.equal( null, err );
        db.collection( userCollection ).findOne( {
                'uid': uid
            },
            function ( err, result ) {
                callback( err, result );
            }
        );
    } );
}

var addUser = function ( uid, name, group, callback ) {
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        var user = {
            "uid": uid,
            "name": name,
            "group": group
        };

        db.collection( userCollection ).insertOne(
            user,
            function ( err, result ) {
                if ( err ) {
                    logger.verbose( 'user already added', { uid: uid} );
                } else {
                    assert.equal( err, null );
                    logger.verbose( 'added a user', { uid: uid} );
                    callback( result );
                }
                db.close();
            }
        );
    } );
}

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

app.get( /(wip|todo|waiting|all|ready|ticket|open|create)/, function ( req, res ) {
    res.sendfile( __dirname + '/dev/index.html' );
} );

MongoClient.connect( url, function ( err, db ) {
    assert.equal( null, err );

    db.collection( userCollection ).createIndex( {
        "uid": 1
    }, {
        unique: true
    } )
} );



//addUser(50251, "manf", "Admin", function(){});
//addUser(2903, "Malte", "Admin", function(){});
//addUser(11954, "Mario", "User", function(){});


io.sockets.on( 'connection', function ( socket ) {
    socket.user = {}

    getUser( 50251, function ( err, result ) {
        socket.user = result;
        logger.verbose( "new Connection", { user: user._id });
    } );


    socket.on( 'new ticket', function ( data ) {
        tickets.createTicket( data.title, data.content, socket.user, function (result) {
            io.sockets.emit( 'ticket', result );
        } );
    } );

    socket.on( 'new comment', function ( data ) {
        tickets.createComment( data.id, data.comment, socket.user, function ( result ) {
            io.sockets.emit( 'new comment', result );
        } );
    } );

    socket.on( 'add tag', function ( data ) {
        tickets.addTag( data.id, data.tag, socket.user, function () {
            io.sockets.emit( 'add tag', data );
        } );
    } );

    socket.on( 'remove tag', function ( data ) {
        tickets.removeTag( data.id, data.tag, socket.user, function () {
            io.sockets.emit( 'remove tag', data );
        } );
    } );

    socket.on( 'change status', function ( data ) {
        tickets.changeStatus( data.id, data.status, socket.user, function () {
            io.sockets.emit( 'change status', data );
        } );
    } );

    tickets.findAllComments( function ( data ) {
        if ( data != null ) {
            socket.emit( 'ticket', data );
        }
    } );
} );

logger.info( 'Server is runing at http://localhost:' + conf.port + '/' );
