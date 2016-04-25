"use strict";

var initSocket = function(e) {
  var socket = new WebSocket("ws://" + e.data.serverPath);

  socket.onopen = function() {
    socket.send(JSON.stringify({
      type: 'register',
      id: e.data.id
    }));
  };

  socket.onmessage = function(evt) {
    var received_msg = evt.data;
    self.postMessage(evt.data);
  };

  socket.onclose = function() {
    console.error("Connection is closed...");
  };
};

self.addEventListener('message', initSocket);
