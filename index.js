'use strict';

const http = require('http');
const ws = require('ws');
const WSRouter = require("./wsRouter");
const { v4: uuidv4 } = require('uuid');

module.exports = function(app, httpServer) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var server = httpServer;

    if (server === null || server === undefined) {
        /* No HTTP server was explicitly provided, create one for our Express application. */
        server = http.createServer(app);

        app.listen = function serverListen() {
            var _server;

            return (_server = server).listen.apply(_server, arguments);
        };
    }

    /* Adding custom wsRoutes as ws router - Might become WSRouter ?? */
    if(app.wsRouter === null || app.wsRouter === undefined){
        app.wsRouter = new WSRouter();
    }

    /* Adding custom ws method */
    if (app.ws === null || app.ws === undefined) {
        app.ws = function (){
            app.wsRouter.ws.apply(app.wsRouter,arguments);
        }
    }

    /* Create websocket server over httpServer */
    var wsOptions = options.wsOptions || {};
    wsOptions.server = server;
    var wsServer = new ws.Server(wsOptions);

    /* Handling connection routing */
    wsServer.on('connection', function (socket, request) {

        /* Giving socket identifier */
        socket.id = uuidv4();

        /* Finding a wsroute that matches the request url */
        /*var match;
        var wsRoute;
        var idx = 0;
        while (match !== true && idx < app.wsRoutes.length) {
            wsRoute = app.wsRoutes[idx++];
            match = wsRoute.match(request.url);
        }

        if (match) {
            wsRoute.handle(request, socket);
        }
        else{
            console.log("No WSRoute found");
        }*/
        app.wsRouter(request, socket, function(){});

    });

    /* Make ws server accessible through wss app if possible, the idea is to allow other listeners on the server */
    if (app.wss === null || app.wss === undefined) {
        app.wss = wsServer;
    }
};

/**
 * ?app.useWS
 * Adding a route to something or in case of router : the router
 */

 /**
  * Router should handler / use similarly
  * Are websocket handler, but no client with wsInstance ?
  * Have a name - regex - params ... Similar to wsRoute !
  * But handler redo routing process
  * 
  * App has default router which path is / and handle : route to its routes
  */