function WSRouteInstance(name){

    this.name = name;
    this.nbClients = 0;
    this.clients = [];
};


WSRouteInstance.prototype.add = function(ws){
    this.nbClients++;
    this.clients.push(ws);
};

WSRouteInstance.prototype.remove = function(ws){
    var index = this.clients.findIndex(socket => socket.id === ws.id);
    if(index > -1){
        this.nbClients--;
        this.clients.splice(index,1);
    }
};

WSRouteInstance.prototype.broadcast = function(msg){
    this.clients.forEach(clientws => {
        clientws.send(msg);
    });
};

module.exports = WSRouteInstance;