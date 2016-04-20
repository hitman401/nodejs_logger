"use strict";

// importScripts('https://cdn.socket.io/socket.io-1.4.5.js');

var socket = new WebSocket("ws://localhost:3000/");;

socket.onmessage = function(evt) {
  var received_msg = evt.data;
  self.postMessage(evt.data);
};

socket.onclose = function() {
  // websocket is closed.
  console.log("Connection is closed...");
};

self.addEventListener('message', function(e) {
  socket.onopen = function() {
    socket.send(JSON.stringify({
      type: 'register',
      id: e.data.id
    }));
  };
});

// socket.emit('register', {id: });
//
// socket.on('message', function(msg) {
//   self.postMessage(msg);
// });
//
