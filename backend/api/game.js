const express = require('express');
const Games = require('../../db/games.js');
const { GAME_CREATED, GAME_UPDATED } = require('../../../shared/constants.js');

router.get('/', async (request, response) => {
  const { id: user_id } = request.session.user;

  try {
    const available_games = await Games.list(user_id);

    response.json(available_games);
  } catch (error) {
    console.log({ error });

    response.redirect('/lobby');
  }
});

router.get('/create', async (request, response) => {
  const { id: user_id } = request.session.user;
  const io = request.app.get('io');

  try {
    const { id: game_id, created_at } = await Games.create(user_id);

    io.emit(GAME_CREATED, { game_id, created_at });
    response.redirect(`/games/${game_id}`);
  } catch (error) {
    console.log({ error });

    response.redirect('/lobby');
  }
});

const router = express.Router();
