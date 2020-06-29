const setPrototypeOf = require('setprototypeof');
const WSRoute = require("./wsRoute");
const {flatten} = require('array-flatten');

var proto = module.exports = function(){

    function wsrouter(req, ws, next){
        wsrouter.dispatch(req,ws,next);
    }

    /**
     * Weird mixin thing inspired by express code
     * Merge the wsrouter function object with proto
     * Allow wsrouter to be used as a function but also as an object with functions...
     * Damn Javascript...
     */
    setPrototypeOf(wsrouter, proto);

    wsrouter.wsRoutes = [];

    return wsrouter;
}

proto.ws = function(fn){
    // first arg must be string value because it's the path
    var path = "/";
    var offset = 0;

    if (typeof fn !== 'function') {
        var arg = fn;
    
        while (Array.isArray(arg) && arg.length !== 0) {
          arg = arg[0];
        }
    
        // first arg is the path
        if (typeof arg !== 'function') {
          offset = 1;
          path = fn;
        }
      }

    var handlers = flatten(Array.prototype.slice.call(arguments, offset));

    //New wsroute is added if not existing, otherwise handlers are added to existing route
    var idx = this.wsRoutes.findIndex(wsRoute => wsRoute.name === path);
    if(idx > -1){
        this.wsRoutes[idx].addHandlers(handlers);
    }
    else{
        this.wsRoutes.push(new WSRoute(path, handlers));
    }
    
    return this;
}

proto.dispatch = function (req, ws, next){
    /* Finding a wsroute that matches the request url */
    var match;
    var wsRoute;
    var idx = 0;

    var currentUrl = req.url.replace(/\/$/, '');
    var remainingUrl = currentUrl.replace(req.processedUrl, "");

    //Dispatching to every routes matching
    while (idx < this.wsRoutes.length) {
        wsRoute = this.wsRoutes[idx++];

        match = wsRoute.match(remainingUrl);

        if (match) {
            wsRoute.handle(req, ws);
        }
    }

    req.processedUrl = req.url;

    next();
}