const express = require('express');
const router = express.Router();
const Games = require('../db/games.js');

// Enum describing what is allowed on what part of the turn, see game.turn_progress
// Draw is start of turn, player can draw from deck or discard
// Middle is when player can select cards for actions. Allowed to:
// Discard: ends turn
// Meld
// Knock
// Three special draw phases can happen only at the start of the game, in this order.
// If a draw happens, skip to Middle and play as normal
// OppositeDraw is first turn only. Player can draw from discard or end turn, pass to other
// DealerDraw is first turn only. Player can draw from discard or end turn, pass to other
// OppositeMustDraw is first turn only. Player must draw from deck.
const TurnProgress = {
  OppositeDraw: -3,
  DealerDraw: -2,
  OppositeMustDraw: -1,
  Draw: 0,
  Middle: 1,
};

router.post('/:id/start', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  console.log('\nGot the request\n');
  console.log(game_id);
  const host = await Games.host_of_game_id(game_id);
  console.log('In post');
  const p2 = await Games.not_host_of_game_id(game_id);
  console.log(host.player1_id, request.session.user_id, p2);
  if (host.player1_id == request.session.user_id && p2.player2_id != null) {
    await Games.start_game(game_id);
    console.log('Redirecting to game');

    // response.status(302);
    const io = request.app.get('io');
    io.to(`/lobby/${request.params.id}/${host.player1_id}`).emit(
      'redirect-to-game',
      {
        game_id,
      }
    );

    io.to(`/lobby/${request.params.id}/${p2.player2_id}`).emit(
      'redirect-to-game',
      {
        game_id,
      }
    );

    response.send();
  } else {
    console.log("Person who tried to start was not host, or p2 doesn't exist");
    response.status(204);
    response.send();
  }
});

// Check if game exists, then check if player is in game, else redirect home
router.get('/:id', async (request, response, next) => {
  const game_id = request.params.id;
  console.log('In get for game id', game_id);
  const game = await Games.get_game_by_id(game_id);

  if (game != null && request.session.user_id != null && game.turn != -1) {
    var player1_name = await Games.player1_of_game_id(request.params.id);
    var player2_name = await Games.player2_of_game_id(request.params.id);
    if (
      game.player1_id == request.session.user_id ||
      (game.player2_id != null && game.player2_id == request.session.user_id)
    ) {
      // Player only needs to know their own hand
      // TODO: Check if opposite player has knocked. Will need to show
      var player_hand = null;

      var cur_player_name = player2_name.username;
      if (game.player1_id == game.turn) {
        cur_player_name = player1_name.username;
      }
      if (request.session.user_id == game.player1_id) {
        player_hand = game.hand1;
      } else {
        player_hand = game.hand2;
      }
      var top_card = game.discard[game.discard_index];
      response.render('game.ejs', {
        title: 'Game',
        roomname: game.game_id,
        current_player: cur_player_name,
        players: [player1_name.username, player2_name.username],
        turn: game.turn,
        message: 'Gin Rummy: Game',
        player1: game.player1_id,
        player2: game.player2_id,
        hand: player_hand,
        discard_top: top_card,
        loggedIn: true,
        can_pass: game.turn_progress < -1,
      });
    } else {
      // Player tried to access game, but is not in game
      console.log("Player tried to join game they aren't in");
      response.redirect('/');
    }
  } else {
    // Game does not exist or player not user, or game not started, redirect home
    console.log(
      "Player tried to join game that doesn't exist or was not started"
    );
    response.redirect('/');
  }
});

// Check if allowed to end turn now
// Change turns
router.post('/:id/end_turn', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  const player = request.session.user_id;
  const game = await Games.get_game_by_id(game_id);

  if (!is_valid_access(game, player)) {
    response.send();

    response.status(403);
    return null;
  }

  if (
    game.turn_progress == TurnProgress.OppositeDraw ||
    game.turn_progress == TurnProgress.DealerDraw
  ) {
    await swap_turn(game, io);
    response.send();

    response.status(200);
  } else {

    const location = `/games/${game_id}/${player}`;
    const message = 'You cannot end the turn right now';

    await emit_error_message(io, player, location, message);

    response.send();

    response.status(403);
  }
});

const swap_turn = async (game, io) => {
  const p1 = game.player1_id;
  const p2 = game.player2_id;
  var current_turn = game.turn;
  var new_turn = p1;
  var progress = game.turn_progress;
  var new_progress = 0;
  if (p1 == current_turn) {
    new_turn = p2;
  }

  if (progress == TurnProgress.OppositeDraw) {
    new_progress = TurnProgress.DealerDraw;
  } else {
    if (progress == TurnProgress.DealerDraw) {
      new_progress == TurnProgress.OppositeMustDraw;
    }
  }

  await Games.start_new_turn(game.game_id, new_turn, new_progress);

  await emit_new_turn(io, game.game_id, p1 == new_turn, new_progress < -1);
};

// Check if allowed to draw from destination, draw, emit for updates
router.post('/:id/draw_deck', async (request, response, next) => {
  const io = request.app.get('io');

  const game_id = request.params.id;
  const player = request.session.user_id;
  const game = await Games.get_game_by_id(game_id);

  if (is_valid_access(game, player) == false) {
    response.send();

    response.status(403);
    return null;
  }

  if (
    game.turn_progress == TurnProgress.Draw ||
    game.turn_progress == TurnProgress.OppositeMustDraw
  ) {
    await Games.draw_card(game_id, player);
    await emit_hand_update(
      io,
      game_id,
      player,
      await Games.get_hand_by_player(game_id, player)
    );
    await Games.set_turn_progress(game_id, TurnProgress.Middle);
    response.send();

    response.status(200);
  } else {
    const location = `/games/${game_id}/${player}`;
    const message = 'You cannot draw from the stock right now';

    await emit_error_message(io, player, location, message);
    response.send();

    response.status(403);
  }
});

// Check if allowed to draw from destination, draw emit for updates
router.post('/:id/draw_discard', async (request, response, next) => {
  const io = request.app.get('io');

  const game_id = request.params.id;
  const player = request.session.user_id;
  const game = await Games.get_game_by_id(game_id);

  if (!is_valid_access(game, player)) {
    response.send();

    response.status(403);
    return null;
  }

  if (
    game.discard_index != 0 &&
    (game.turn_progress == TurnProgress.Draw ||
      game.turn_progress == TurnProgress.OppositeDraw ||
      game.turn_progress == TurnProgress.DealerDraw)
  ) {
    var top_card = await Games.draw_from_discard(game_id, player);

    await emit_discard_update(io, game_id, top_card);
    await emit_hand_update(
      io,
      game_id,
      player,
      await Games.get_hand_by_player(game_id, player)
    );
    await Games.set_turn_progress(game_id, TurnProgress.Middle);

    response.send();

    response.status(200);
  } else {
    const location = `/games/${game_id}/${player}`;
    var message = 'You cannot draw from the discard pile right now';
    if (game.discard_index == 0) {
      message = 'You cannot draw from an empty discard pile';
    }

    await emit_error_message(io, player, location, message);

    response.send();

    response.status(403);
  }
});

// Check if allowed to discard, discard, emit for updates
router.post('/:id/discard', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  const player = request.session.user_id;
  const game = await Games.get_game_by_id(game_id);

  if (is_valid_access(game, player) == false) {
    response.send();

    response.status(403);
    return null;
  }

  if (
    game.turn_progress == TurnProgress.Middle &&
    request.body.selected_cards != null &&
    request.body.selected_cards.length == 1
  ) {
    var index = request.body.selected_cards[0];
    console.log('Index is ', index);
    if (index < 11) {
      var top_card = await Games.discard_from_hand(game_id, player, index);
      await emit_discard_update(io, game_id, top_card);

      await emit_hand_update(
        io,
        game_id,
        player,
        await Games.get_hand_by_player(game_id, player)
      );

      // HEYY: Set this to end turn somewhere, probably just call swap turn instead
      // await Games.set_turn_progress(game_id, TurnProgress.Draw);
      await swap_turn(game, io);
      response.send();

      response.status(200);
      return null;
    } else {
      const location = `/games/${game_id}/${player}`;
      const message = 'Cannot discard out of bounds';

      await emit_error_message(io, player, location, message);
      response.send();

      response.status(403);
      return null;
    }
  } else if (
    request.body.selected_cards != null &&
    request.body.selected_cards.length > 1
  ) {
    const location = `/games/${game_id}/${player}`;
    const message = 'You can only discard one card';

    await emit_error_message(io, player, location, message);
    response.send();

    response.status(403);
  } else {
    const location = `/games/${game_id}/${player}`;
    const message = 'You cannot discard right now';

    await emit_error_message(io, player, location, message);
    response.send();

    response.status(403);
  }
});

// Emits to player what meld they just made
    // Melds are client-side until send with knock, so they can refresh
    // themselves by checking chat
router.post('/:id/meld', async (request, response, next) => {
    const io = request.app.get('io');
    const game_id = request.params.id;
    const player = request.session.user_id;
    const melds = request.body.string;
  
    const message = "Current melds hand indecies: " + melds
    const location = `/games/${game_id}/${player}`;

    await emit_notice(io, location, message)

    response.send()
    response.status(200)

})

// Check if allowed to meld, check for valid meld
router.post('/:id/knock', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  const player = request.session.user_id;
  const melds = request.body.melds;
  const game = await Games.get_game_by_id(game_id);


  if (is_valid_access(game, player) == false) {
    response.send();

    response.status(403);
    return null;
  }


  const hand = await Games.get_hand_by_player(game_id, player);
  var meld_success = (melds.length > 0)

  console.log("Checking knock")
  // Check all melds for validity
  for(var i=0; i < melds.length; i++){
    meld_success = is_valid_meld(hand, melds[i])
    if(meld_success == false){
        break
    }
  }

  if (meld_success == true){
    const location = `/games/${game_id}/${player}`;
    const message = 'Melding Was Successful';
    await emit_meld_update(io, location, message)
  }else{
    const location = `/games/${game_id}/${player}`;
    const message = 'Melds were not valid';
    await emit_meld_update(io, location, message)
  }

  
});

const is_valid_meld = (hand, meld) => {
  const meldID = cardID_to_hand(hand, meld);
  if (!is_Enough_Meld(meldID)) {
    return false;
  }
  if (!is_Ascending_Num(meldID) && !is_Same_Suite(meldID)) {
    return false;
  }
  return true;
};
const cardID_to_hand = (hand, meld) => {
  const meldArray = meld.map((index) => hand[index]);
  return meldArray;
};
const is_Enough_Meld = (meld) => {
  if (meld.length >= 3 || meld.length <= 10) {
    return true;
  } else {
    return false;
  }
};
const is_Ascending_Num = (meld) => {
  for (let i = 1; i < meld.length; i++) {
    if (meld[i] % 13 == 1 || meld[i] !== meld[i - 1] + 1) {
      return false;
    }
  }
  return true;
};
const is_Same_Suite = (meld) => {
  for (let i = 0; i < meld.length; i++) {
    meld[i] = meld[i] % 13;
  }
  for (let i = 1; i < meld.length; i++) {
    if (meld[i] !== meld[0]) {
      return false; // Found a different number, not all numbers are the same
    }
  }
  return true;
};
// Returns true if:
// Game exists
// Game is not complete
// Player is in game, it is the player's turn, and the game is started
// These three are the same check, since turn = some player_id if game is started
const is_valid_access = (game, player_id) => {
  return game != null && game.completed != false && game.turn == player_id;
};

// Get name of player whose turn it will be, emit to players in game
const emit_new_turn = async (io, game_id, is_p1_turn, is_passable_turn) => {
  var player = '';

  if (is_p1_turn == true) {
    player = (await Games.player1_of_game_id(game_id)).username;
  } else {
    player = (await Games.player2_of_game_id(game_id)).username;
  }

  io.to(`/games/${game_id}`).emit('update-turn', {
    player,
    is_passable_turn,
  });
};

const emit_discard_update = async (io, game_id, top_card) => {
  if (top_card == null) {
    top_card = 0;
  }
  io.to(`/games/${game_id}`).emit('update-discard-pile', {
    discard_top: top_card,
  });
};

const emit_hand_update = async (io, game_id, player, hand) => {
  io.to(`/games/${game_id}/${player}`).emit('update-hand', {
    hand,
  });
};
const emit_meld_update = async (io, location, message) => {
  console.log('Emitting ', message);
  const username = 'SYSTEM';
  const timestamp = "";

  io.to(location).emit('chat-message-received', {
    message,
    username,
    timestamp,
  });
};

const emit_error_message = async (io, player, location, message) => {
  console.log('Emitting ', message);
  const username = '!!ERROR!!';
  const timestamp = "";

  io.to(location).emit('chat-message-received', {
    message,
    username,
    timestamp,
  });
};

const emit_notice = async (io, location, message) => {
    console.log('Emitting ', message);
    const username = 'NOTICE: ';
    const timestamp = ""
  
    io.to(location).emit('chat-message-received', {
      message,
      username,
      timestamp,
    });
  };

module.exports = router;
