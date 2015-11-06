var express = require( 'express' ),
    app = express(),
    server = require( 'http' ).createServer( app ),
    io = require( 'socket.io' ).listen( server ),
    conf = require( './config.json' );

var MongoClient = require( 'mongodb' ).MongoClient;
var assert = require( 'assert' );
var ObjectId = require( 'mongodb' ).ObjectID;

var url = conf.mongodb.url;
var ticketCollection = conf.mongodb.collections.tickets;
var userCollection = conf.mongodb.collections.user;

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

var createTicket = function ( title, message, user, callback ) {
    var ticket = {
        'date': new Date(),
        'author': user,
        'status': 'todo',
        'title': title,
        'comments': [ {
            'author': user,
            'date': new Date(),
            'content': message
        }],
        'lastModified': new Date()
    };

    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        db.collection( ticketCollection ).insertOne(
            ticket,
            function ( err, result ) {
                assert.equal( err, null );

                log( 'added a ticket' );

                io.sockets.emit('ticket', ticket);

                callback( result );
            }
        );
    } );
};

var createComment = function ( id, commentContent, user, callback ) {
    comment = {};
    comment.content = commentContent;
    comment.date = new Date();
    comment.author = user;

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
            callback({
                'id' : id,
                'comment' : comment
            })
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

var changeStatus = function( id, status, user, callback){
    updateTicket( id, 'status', status, callback);
}

var addTag = function( id, tag, user, callback){
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

var removeTag = function( id, tag, user, callback){
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

var removeComment = function( id, tag, user, callback){
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

var getUser = function( uid, callback){
    MongoClient.connect( url, function ( err, db ) {
        assert.equal( null, err );

        assert.equal( null, err );
        db.collection( userCollection ).findOne(
            {'uid' : uid },
             function(err, result){
                 callback( err, result );
             }
         );
    } );
}

var addUser = function( uid, name, group, callback){
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
                if(err){
                    log('user (' + uid + ') already added');
                }else{
                    assert.equal( err, null );
                    log( 'added a user (' + uid + ')' );
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

app.get( /(wip|todo|waiting|all|ready|ticket|open|create)/ , function ( req, res ) {
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



MongoClient.connect( url, function ( err, db ) {
    assert.equal( null, err );

    db.collection( userCollection ).createIndex( { "uid": 1 }, { unique: true } )
} );



//addUser(50251, "manf", "Admin", function(){});
//addUser(2903, "Malte", "Admin", function(){});
//addUser(11954, "Mario", "User", function(){});


io.sockets.on( 'connection', function ( socket ) {
    socket.user = {}

    getUser(50251, function(err, result){
        socket.user = result;
    });


    socket.on( 'new ticket', function ( data ) {
        createTicket(data.title, data.content, socket.user, function(){});
    } );

    socket.on( 'new comment', function ( data ) {
        createComment( data.id , data.comment, socket.user , function (result) {
            io.sockets.emit( 'new comment', result);
        } );
    } );

    socket.on( 'add tag', function ( data ) {
        addTag( data.id , data.tag, socket.user , function () {
            io.sockets.emit( 'add tag', data);
        } );
    } );

    socket.on( 'remove tag', function ( data ) {
        removeTag( data.id , data.tag, socket.user , function () {
            io.sockets.emit( 'remove tag', data);
        } );
    } );

    socket.on( 'change status', function ( data ) {
        changeStatus( data.id , data.status, socket.user , function () {
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
