var express = require('express')

var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server)
    , handlers = require('./handlers.js');

io.set('log level', 1);
console.log("socket started ...");
io.sockets.on("connection", handlers.handleSocket );

app.configure(function(){
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

console.log("Express server listening on port 3000");
