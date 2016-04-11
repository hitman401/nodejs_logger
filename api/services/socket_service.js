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
    socket.on('message', function(msg) {
      msg = JSON.parse(msg);
      switch (msg.type) {
        case 'register':
          if (!self.sessions[msg.id]) {
            self.sessions[msg.id] = [];
          }
          console.log('Registered client :: ' + msg.id);
          self.sessions[msg.id].push(socket);
          break;
        default:
          socket.send(JSON.stringify(msg));
      }
    });

    // socket.on('close', function(msg) {
    //   if (!msg) {
    //     return;
    //   }
    //   var userId = msg.id;
    //   var index = self.sessions[userId].indexOf(socket);
    //   if (index === -1) {
    //     return;
    //   }
    //   self.sessions[userId].splice(index, 1);
    // });
  });
};

Socket.prototype.sendLog = function(log, userId) {
  var self = this;
  if (!self.sessions[userId]) {
    return;
  }
  console.log(log, userId);
  self.sessions[userId].forEach(function(socket) {
    socket.emit('message', JSON.stringify(log));
  });
};

module.exports = exports = new Socket();
