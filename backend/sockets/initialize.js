const http = require('http');
const { Server } = require('socket.io');
const sharedsession = require('express-socket.io-session');

const initSockets = (app, sessionMiddleware) => {
  const server = http.createServer(app);
  const io = new Server(server);

  // So sockets uses same middleware as express server
  io.engine.use(sessionMiddleware);

  io.use(sharedsession(sessionMiddleware));

  io.on('connection', function (socket) {
    //   console.log("Connection", socket.handshake);
    const user = socket.handshake.session.user_id;
    // Extra 7 for https://
    const URL = socket.handshake.headers.referer.split(
      socket.handshake.headers.host
    )[1];

    if (user != null) {
      console.log('join', URL);
      console.log('join', URL + '/' + user);
      socket.join(URL);
      socket.join(URL + '/' + user);
    }
  });

  app.set('io', io);

  return server;
};

module.exports = initSockets;
