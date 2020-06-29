# An Express like router for WS websockets

This package aims to provide routing feature to ws websockets. Routing is express-like, using similar structure, but do not need express in order to work. Indeed, this package is build over ws, http, path-to-regexp and small others.

It basically adds a .ws() method to app that allow user to define routes for incoming websockets. It also allow broadcasting only between same routed websockets.

This work was originally inspired by the well known [express-ws](https://github.com/HenningM/express-ws) package that already provide routing system for ws for express apps but I disliked the way it creates new http routes and requests for each new clients.

Disclaimer : This represent my first npm public package and I'm a simple developer with a simple mind... So this package is likely to be buggy and unoptimized. Feel free to report any issue ! Not sure what I'll do with it though...

## Installing

```
npm install --save @tyren/wsrouter
```


## Basic app.<span></span>ws() Usage

All this package essence relies on the new ws method. Thanks to this method you'll be able to define new route for websocket with handlers in the same express routing way. Simply add as many as handlers/middlewares as you want.

### Server side

Let's dive into commented code.
The following example uses express but it should work with any app building framework.

```js

var app = require('express')();

// Extend app possibilities \o/
// Basically creates a websocket server over an http server with provided options.
// This websocket server is accessible through app.wss property
var wsoptions = {};
require("@tyren/wsrouter")(app, wsoptions);

// Now able to use ws method to define routes for ws websockets
app.ws('/firstroute', function(req,ws){
    //Here able to add listeners on ws object which represent the websocket
    ws.on("message", function(msg) {
        
        //For convenience, each ws object as an id accessible by using ws.id
        console.log(ws.id + " : " + JSON.parse(msg));
    })
});

// Like in express, route path is parsed to get url parameters
app.ws('/secondroute/:someParam', function(req, ws){
    console.log(req.params.someParam);
});

// Like in express, you can stack as many handlers as you want
app.ws('/whereisthethirdroute', 
    function(req, ws){ console.log("first handler")}, 
    function(req, ws){ console.log("wow second handler");}
);

// Like in express, propagation between handlers is handled by a next function, that you may call or not 
app.ws('/prettysureimthefourthroute'
    function(req,ws,nex){
        console.log("First called");
        //Call next handler
        next();
    },
    function(req,ws, next){
        console.log("I'm called too !");
    },
    function(req,ws){
        console.log("I'm never called ! Precedent handler does have next parameter but never calls it...");
    }
);

// Note that we call app.listen and not http.listen. Indeed, in absence of http server passed along the app, this package creates a plain new httpServer.
app.listen(3000, () => {
    console.log("Server with websocket routing started !");
})

```

### Client side

This package doesn't offer client side implementation. Following code is just an illustration working with precedent server side code.

```js

const ws1 = new WebSocket('ws://localhost:3000/firstroute');
ws1.addEventListener('open', function (m) { 
    ws1.send("I'm alive !");
});
// Print "{socket id} : I'm alive !" on server console

const ws2 = new WebSocket('ws://localhost:3000/secondroute/parametersAreGreat');
// Print "parametersAreGreat" on server console

const ws3 = new WebSocket('ws://localhost:3000/whereisthethirdroute');
// Print on server console
// > first handler
// > wow second handler

const ws4 = new WebSocket('ws://localhost:3000/prettysureimthefourthroute');
// Print on server console
// > first called
// > I'm called too !

```

## WS Router

In the same way as express, wsrouter provide a brand new object called WSRouter that you can create and use in the same way that you use app.ws. Once set up, you can use those routers as handlers. Let's go to code !

```js
var app = require('express')();

// Extend app possibilities \o/
require("@tyren/wsrouter")(app);

var wsRouter1 = new WSRouter();

wsRouter1.ws("/:param", function(res,ws){ console.log(req.params.param); });

var wsRouter2 = new WSRouter();

wsRouter2.ws("/", function(res,ws){ console.log("Good Job !"); });

// All websockets opened on /module1 will be dispatched to wsRouter1
app.ws("/module1", wsRouter1);

// All websockets opened on /module2 will be dispatched to wsRouter2
app.ws("/module2", wsRouter2);

// All websockets opened on /modulemix will be dispatched to wsRouter1 and wsRouter2
app.ws("/modulemix", wsRouter1, wsRouter2);

```

## Routes and routeinstance

Finally, endpoints routes save sockets in a wsRouteInstance object accessible through ws.routeInstance. The goal is to allow broadcasting only to sockets connected to the same route.
ws.routeInstance has 3 fields:

```js

// WS Route name corresponding to path
ws.routeInstance.name
// All websockets connected to this route
ws.routeInstance.clients
// Number of websockets connected to this route
ws.routeInstance.nbClients
// 
```

## ENJOY ([and check my website](https://tilab.fr))




