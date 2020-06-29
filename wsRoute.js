const pathToRegexp = require('path-to-regexp');
const WSRouteInstance = require('./wsRouteInstance');

function WSRoute(path, handlers){

    //Remove last slash if exists
    if(path.length > 1);
        path = path.replace(/\/$/, '');

    this.plainPath = path;
    this.nbSlashs = path.split("/").length - 1;

    this.currentParams = undefined;
    this.currentPath = undefined;
    this.pathToRegexp =  pathToRegexp.match(path, { decode: decodeURIComponent });

    //Stack handlers like middlewares
    this.handlersStack = [];
    this.addHandlers(handlers);

    //Store client for each route instance
    this.wsRouteInstances = new Map();
};

WSRoute.prototype.match = function (path){
    var match;

    //Matching only on equally "/" numbered path portion
    path = path.split("/")
    path.splice(this.nbSlashs + 1);
    path = path.join("/");

    if (path != null) {
        match = this.pathToRegexp(path);
    }

    //Save current parsed. Preventing a second call when handling
    if (match) {
        this.currentParams = match.params;
        this.currentPath = match.path;

        return true;
    }
    else{
        this.params = undefined;
        this.currentPath = undefined;

        return false; 
    }
};

WSRoute.prototype.handle = function (req, ws){

    /**
     * Check the pre-processed Url and saving it to a fixed object sent to each child routes
    */
    if(req.processedUrl === undefined )
        req.processedUrl = "";
    var processedUrl = req.processedUrl + this.currentPath;

    /**
     * Check if predecessor parameters exists
     * Copying actual to a fixed params object sent to each child routes
     * Using ES6 spread syntax. Old trick for copy still in comment
    */
    if(req.params == null || req.params == undefined)
        req.params = {};
    var params = {...req.params, ...this.currentParams};
    //var params = JSON.parse(JSON.stringify(req.params));
    //Object.assign(params, this.currentParams);

    /**
     * If true then no other route will process request. Add wsRouteInstance. 
    */
    var isFinalRoute = false;
    var wsRouteInstance;
    if(req.url.length == processedUrl.length){
        isFinalRoute = true;
        // Save client in route instance array

        if(this.wsRouteInstances.has(req.url)){
            wsRouteInstance = this.wsRouteInstances.get(req.url);
            wsRouteInstance.add(ws);
        }
        else{
            wsRouteInstance = new WSRouteInstance(req.url);
            wsRouteInstance.add(ws);
            this.wsRouteInstances.set(req.url, wsRouteInstance);
        }
        ws.routeInstance = wsRouteInstance;
    }

    // Freeze context for next function
    var idx = 0;
    var stack = this.handlersStack;
    var wsRouteInstances = this.wsRouteInstances;


    /* Execute handlers in a middleware fashion way */
    next();

    function next(){
        if(idx < stack.length){
            //Request infos are reset before every dispatching to same level middlewares
            req.processedUrl = processedUrl;
            req.params = params;
            
            stack[idx++](req, ws, next);
        }else{
            if(isFinalRoute){
                ws.on("close", function(){
                    ws.routeInstance.remove(ws);
                    if(ws.routeInstance.nbClients == 0)
                        wsRouteInstances.delete(ws.routeInstance.name);
                });
            }
        }
    };
};


WSRoute.prototype.addHandlers = function(handlers){

    //Decorator allowing us to wrap function with not enough arguments
    const makeNextHanlder = function(fn){
        return function(req, ws, next){
            fn.apply(this, [req,ws]);
            next();
        }
    }

    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];

        if (typeof handler !== 'function') {
            throw new Error('router.ws need object of type function as handler but got a ' + toString.call(handler));
        }
        else{
            if(!(handler.length == 3 || handler.length == 2)){
                throw new Error('router.ws need a function with 2 or 3 arguments (request, ws and optional next function) but got ' + handler.length + ' arguments');
            }

            //If no next argument, wrapping function with next call at the end
            if(handler.length != 3){
                handler = makeNextHanlder(handler);
                this.handlersStack.push(handler);
            }
            else{
                this.handlersStack.push(handler);
            }
            
        }
    }
}


module.exports = WSRoute;