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
    console.log('connected');
    var userId = null;
    socket.on('message', function(msg) {
      try {
        msg = msg.toString().replace(/\\/g, '/');
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
          userId = msg.id;
          self.sessions[userId].push(socket);
          break;
        default:
          logService.save(msg, function() {});
      }
    });

    socket.on('close', function() {
      if (!userId) {
        return;
      }
      var index = self.sessions[userId].indexOf(socket);
      if (index === -1) {
        return;
      }
      self.sessions[userId].splice(index, 1);
    });
  });
};

Socket.prototype.sendLog = function(log, userId) {
  var self = this;
  if (!self.sessions[userId]) {
    return;
  }
  self.sessions[userId].forEach(function(socket) {
    socket.send(JSON.stringify(log));
  });
};

module.exports = exports = new Socket();
