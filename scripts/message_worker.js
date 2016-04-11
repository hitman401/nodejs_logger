"use strict";

importScripts('https://cdn.socket.io/socket.io-1.4.5.js');

var socket = io();

socket.on('message', function(msg) {
  self.postMessage(msg);
});

self.addEventListener('message', function(e) {
  socket.emit('register', {id: e.data.id});
});
