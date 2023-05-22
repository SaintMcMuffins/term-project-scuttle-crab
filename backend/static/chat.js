const express = require('express');
const router = express.Router();

router.post('/:id', (request, response, next) => {
  const io = request.app.get('io');
  const { message } = request.body;
  const username = request.session.username;
  const timestamp = new Date().toISOString();

  io.emit('chat-message-received', {
    message,
    username,
    timestamp,
  });

  response.send();

  response.status(200);
});

module.exports = router;
