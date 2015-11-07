var express = require( 'express' ),
    app = express(),
    server = require( 'http' ).createServer( app ),
    io = require( 'socket.io' ).listen( server ),
    conf = require( './config.json' ),
    tickets = require( './server/tickets.js' ),
    users = require( './server/users.js' ),
    logger = require( './server/logger.js' );


server.listen( conf.port );

app.use( express.static( __dirname + '/dev' ) );

app.get( '/', function ( req, res ) {
    res.sendfile( __dirname + '/dev/index.html' );
} );

app.get( /(wip|todo|waiting|all|ready|ticket|open|create)/, function ( req, res ) {
    res.sendfile( __dirname + '/dev/index.html' );
} );

//users.add(29403, "Malte", "Admin", function(){});

//admin : 29403
//user : 111954

io.sockets.on( 'connection', function ( socket ) {
    socket.user = {}

    users.get( 111954, function ( err, result ) {
        socket.user = result;
        logger.verbose( "new Connection", { user: socket.user._id });

        if(users.hasPermission(socket.user, 'ticket.view.all')){
            tickets.findAllTickets( function ( data ) {
                if ( data != null ) {
                    socket.emit( 'load init tickets', data );
                }
            } );
            tickets.countAllTickets( function ( status, amount ) {
                if ( amount != null ) {
                    socket.emit( 'ticketCount', status, amount );
                }
            } );
        }else if(users.hasPermission(socket.user, 'ticket.view.own')){
            tickets.findOwnTickets( socket.user, function ( data ) {
                if ( data != null ) {
                    socket.emit( 'load init tickets', data );
                }
            } );
            tickets.countOwnTickets( socket.user, function ( status, amount ) {
                if ( amount != null ) {
                    socket.emit( 'ticketCount', status, amount );
                }
            } );
        }
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
} );

logger.info( 'Server is runing at http://localhost:' + conf.port + '/' );
