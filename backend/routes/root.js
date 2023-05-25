const express = require('express');
const router = express.Router();
const Games = require('../db/games.js');

router.get('/', (request, response) => {
  const name = 'person';
  const loggedIn = request.session.username ? true : false;

  response.render('home.ejs', {
    title: 'Home',
    message: 'Gin Rummy: Home Page',
    username: request.session.username,
    loggedIn: loggedIn,
  });
});

router.get('/login', (request, response) => {
  const name = 'person';

  response.render('login.ejs', {
    title: 'Login',
    message: 'Gin Rummy: Login',
  });
});

router.get('/register', (request, response) => {
  const name = 'person';
  response.render('register.ejs', {
    title: 'Register',
    message: 'Gin Rummy: Register',
  });
});

router.get('/findgame', async (request, response, next) => {
  console.log('Looking for games...');

  const game = await Games.find_open_game();

  // Redirect back home if join fails or game isn't found
  if (game != null && request.session.user_id != game.player1_id) {
    try {
      await Games.join_game(game.game_id, request.session.user_id);
      const io = request.app.get('io');
      const p2 = (await Games.player2_of_game_id(game.game_id)).username;
      // Let waiting player know someone joined
      io.to(`/lobby/${game.game_id}/${game.player1_id}`).emit(
        'player-joined-lobby',
        {
          p2,
        }
      );
      response.redirect(`/lobby/${game.game_id}`);
    } catch {
      response.redirect('/');
    }
  } else {
    response.redirect('/');
  }
});

router.get('/game', (request, response) => {
  const name = 'person';
  const loggedIn = request.session.username ? true : false;

  response.render('game.ejs', {
    title: 'Game',
    message: 'Gin Rummy: Game',
    username: request.session.username,
    loggedIn: loggedIn,
  });
});

router.get('/lobby/:id', async (request, response) => {
  var player1_name, player2_name;
  var can_join = false;
  var game_started = false;
  const loggedIn = request.session.username ? true : false;
  if (loggedIn == false) {
    response.redirect('/');
    return null;
  } else {
    try {
      const game = await Games.get_game_by_id(request.params.id);
      if (
        request.session.user_id == game.player1_id ||
        request.session.user_id == game.player2_id
      ) {
        can_join = true;
      }
      game_started = game.turn != -1;
    } catch {}
  }
  if (can_join == false) {
    // Not part of the game, go home
    response.redirect('/');
  } else {
    if (game_started == true) {
      // Game is started, so go there instead
      response.redirect(`/games/${request.params.id}`);
    } else {
      // Join lobby
      try {
        player1_name = await Games.player1_of_game_id(request.params.id);
        host = await Games.host_of_game_id(request.params.id);
        try {
          player2_name = await Games.player2_of_game_id(request.params.id);
        } catch {
          // Player2 not in game yet, returned nothing on query
          player2_name = { username: '' };
        }

        if (player2_name == null) {
          player2_name = { username: '' };
        }
        console.log(player1_name.username);
        console.log(player2_name);

        response.render('lobby.ejs', {
          title: 'Lobby',
          roomname: request.params.id,
          host: player1_name.username,
          players: [player1_name.username, player2_name.username],
          ishost: request.session.user_id == host.player1_id,
          message: 'Gin Rummy: Lobby',
          username: request.session.username,
          loggedIn: loggedIn,
        });
      } catch (error) {
        console.log({ error });
        response.redirect('/');
      }
    }
  }
});

router.get('/joinGame', (request, response) => {
  const name = 'person';
  const loggedIn = request.session.username ? true : false;
  response.render('joinGame.ejs', {
    title: 'Join Game',
    message: 'Gin Rummy: Join Game',
    username: request.session.username,
    loggedIn: loggedIn,
  });
});

router.get('/creategame', async (request, response) => {
  const io = request.app.get('io');

  try {
    const { game_id } = await Games.create(request.session.user_id);
    console.log(game_id);
    // io.emit(GAME_CREATED, { game_id, created_at });
    response.redirect(`/lobby/${game_id}`);
  } catch (error) {
    console.log({ error });

    response.redirect('/');
  }
});

router.get('/rules', (request, response) => {
  const name = 'person';
  const loggedIn = request.session.username ? true : false;

  response.render('rules.ejs', {
    title: 'Rules',
    message: 'Gin Rummy: Rules',
    username: request.session.username,
    loggedIn: loggedIn,
  });
});

router.get('/cards', (request, response) => {
  const name = 'person';

  response.render('cardsTest.ejs', {
    title: 'CardsTest',
    message: 'Gin Rummy: Lobby',
  });
});

router.get('/logout', async (request, response) => {
  const loggedIn = request.session.username ? true : false;

  request.session.destroy();
  response.render('home.ejs', {
    title: 'Home',
    loggedIn: false,
    error: '',
  });
});

module.exports = router;
