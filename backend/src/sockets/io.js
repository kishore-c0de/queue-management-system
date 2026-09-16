// src/sockets/io.js
//
// Controllers need to emit socket events (e.g. after a token's status
// changes), but they don't have direct access to the http server.
// This module holds a single shared `io` instance that server.js
// initializes once, and that any controller can pull via getIO().

let ioInstance = null;

function initIO(server) {
  const { Server } = require('socket.io');

  ioInstance = new Server(server, {
    cors: { origin: '*' },
  });

  ioInstance.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initIO, getIO };
