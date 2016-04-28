var logService = require('../services/log_service');

var Socket = function() {
  this.sessions = {};
};

Socket.prototype.register = function(server) {
  var self = this;
  var WebSocketServer = require('ws').Server;
  var ws = new WebSocketServer({ server: server });
  var sessions = {};
  ws.on('connection', function(socket) {
    var sessionId = null;
    socket.on('message', function(msg) {
      try {
        msg = msg.toString().replace(/\n/g, '').replace(/\\/g, '/');        
        msg = JSON.parse(msg);
      } catch(e) {
        return console.log(e.message);
      }
      switch (msg.type) {
        case 'register':
          if (!self.sessions[msg.id]) {
            self.sessions[msg.id] = [];
          }
          console.log('Registered client :: ' + msg.id);
          sessionId = msg.id;
          self.sessions[sessionId].push(socket);
          break;
        default:
          logService.save(msg, function() {});
      }
    });

    socket.on('close', function() {
      if (!sessionId) {
        return;
      }
      var index = self.sessions[sessionId].indexOf(socket);
      if (index === -1) {
        return;
      }
      self.sessions[sessionId].splice(index, 1);
    });
  });
};

Socket.prototype.sendLog = function(log, sessionId) {
  var self = this;
  if (!self.sessions[sessionId]) {
    return;
  }
  self.sessions[sessionId].forEach(function(socket) {
    socket.send(JSON.stringify(log));
  });
};

module.exports = exports = new Socket();
