var app = document.querySelector( '#app' );
var socket;

( function ( document ) {
    app.sortStatus = function ( item, item2 ) {
        item = getStatusId( item.status );
        item2 = getStatusId( item2.status );

        return ( item > item2 ? 1 : -1 );
    }
    app.sortDate = function ( item, item2 ) {
        return ( item.date > item2.date ? 1 : -1 );
    }

    app.search = '';
    app.selectedTag = '';
    app.selectedStatus = '';

    app.ticketFilter = function ( tag, search, status ) {
        return function ( item ) {
            return ( item.title.match( search ) || item.author.name.match( search ) ) &&
            ( tag === '' || item.tags.indexOf( tag ) > -1 )
            && (status === '' || status.indexOf(item.status) > -1);
        }
    }

    app.addTicket = function() {
        addTicket(app.new_title, app.new_content);
    }

    socket = io();

    app.tickets = [];

    socket.on( 'ticket', function ( data ) {
        app.push(
            'tickets',
            data
        );
    } );

    socket.on( 'new comment', function ( data ) {
        var i;
        for ( i in app.tickets ) {
            if ( app.tickets[ i ]._id == data.id ) {
                app.push( "tickets." + i + ".comments", data.comment );
                break;
            }
        }
    } );

    socket.on( 'change status', function ( data ) {
        var i;
        for ( i in app.tickets ) {
            if ( app.tickets[ i ]._id == data.id ) {
                app.tickets[ i ].status = data.status;
                app.notifyPath( "tickets." + i + ".status", data.status );
                break;
            }
        }
    } );

    socket.on( 'add tag', function ( data ) {
        var i;
        for ( i in app.tickets ) {
            if ( app.tickets[ i ]._id === data.id ) {
                if(!app.tickets[ i ].tags){
                    app.tickets[ i ].tags = [];
                }

                app.push( 'tickets.' + i + '.tags', data.tag );
                break;
            }
        }
    } );

    socket.on( 'remove tag', function ( data ) {
        var i;
        for ( i in app.tickets ) {
            if ( app.tickets[ i ]._id === data.id ) {
                app.splice(
                    "tickets." + i + ".tags",
                    app.tickets[ i ].tags.indexOf( data.tag ),
                    1
                );
                break;
            }
        }
    } );


} )( document );


addTicket = function ( title, content ) {
    socket.emit( 'new ticket', {
        title: title,
        content: content
    } );

    app.page = "view"
}

createComment = function ( ticketid, comment ) {
    socket.emit( 'new comment', {
        id: ticketid,
        comment: comment
    } );
}

changeStatus = function ( ticketid, status ) {
    socket.emit( 'change status', {
        id: ticketid,
        status: status
    } );
}

addTag = function ( ticketid, tag ) {
    socket.emit( 'add tag', {
        id: ticketid,
        tag: tag
    } );
}

removeTag = function ( ticketid, tag ) {
    socket.emit( 'remove tag', {
        id: ticketid,
        tag: tag
    } );
}

getStatusId = function ( status ) {
    switch ( status ) {
    case "todo":
        return 0;
    case "wip":
        return 1;
    case "waiting":
        return 2;
    case "ready":
        return 3;
    default:
        return 4;
    }
}
