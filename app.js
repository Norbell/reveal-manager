/* libs */
var express  = require('express'),
    http     = require('http'),
    path     = require('path'),
    socketio = require('socket.io'),
    passport    = require('passport'),
    cookie = require("cookie"),
    connect = require("connect"),
    sessionStore = require("sessionstore").createSessionStore(),
    passportSocketIo = require("passport.socketio");

/* config */
config = require('./config/config');
var routes = require('./config/routes');
require('./auth/passport')(passport);
basepath = __dirname;
websockets = [];

var presentationController = require('./controller/presentation');
db      = require('./dbmodel');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));


app.configure(function() {

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser('meowmeowcat'));
    app.use(express.session({
        store: sessionStore,    
        maxAge  : new Date(Date.now() + 21600000), //5 Hour
        expires : new Date(Date.now() + 21600000), //5 Hour
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes.setRoutes(app, passport);

//init database
db.sequelize
        .sync({force: false})
        .complete(function(err) {
            if (err) {
                throw err
            } else {
                var server = http.createServer(app);
                io = socketio.listen(server);

                io.set('authorization', passportSocketIo.authorize({
                    cookieParser: express.cookieParser,                   
                    secret: 'meowmeowcat',
                    store: sessionStore,
                    success: function(data, accept) {
                          console.log('successful connection to socket.io');
                        accept(null, true);
                    },
                    fail: function(data, message, error, accept) {
                        console.log(data, message)
                        if (error)
                            throw new Error(message);
                        console.log('failed connection to socket.io:', message);

                        // We use this callback to log all of our failed connections.
                        accept(null, true);

                    },
                }));



                server.listen(app.get('port'), function() {
                    console.log('Express server listening on port ' + app.get('port'));
                });
                io.sockets.on('connection', onwebsocketConnection);
                // Disconnect User function
                io.sockets.disconnectUser = function(user_id) {

                    if (websockets[user_id] != undefined) {
                        for (var i = 0; i < websockets[user_id].length; i++) {
                            websockets[user_id][i].disconnect();
                        }
                    }

                }
            }
        })



//socket routes
function onwebsocketConnection(socket){
  
    if(websockets[socket.handshake.user] == undefined)
        websockets[socket.handshake.user] = [];
    
    websockets[socket.handshake.user].push(socket);
    presentationController.setHandler(socket);

}
