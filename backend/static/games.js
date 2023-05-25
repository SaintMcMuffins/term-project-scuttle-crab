const express = require('express');
const router = express.Router();
const Games = require('../db/games.js');

// Enum describing what is allowed on what part of the turn, see game.turn_progress
// Draw is start of turn, player can draw from deck or discard
// Middle is when player can select cards for actions. Allowed to:
// Discard: ends turn
// Knock
// Three special draw phases can happen only at the start of the game, in this order.
// If a draw happens, skip to Middle and play as normal
// OppositeDraw is first turn only. Player can draw from discard or end turn, pass to other
// DealerDraw is first turn only. Player can draw from discard or end turn, pass to other
// OppositeMustDraw is first turn only. Player must draw from deck.
// StartKnock starts when knock validates. Player can discard to end turn and move to OpponentKnock
// OpponentKnock starts when player discards on their StartKnock. Can knock with any deadwood
// LayOff starts after player valid knocks in OpponentKnock. Player can meld hand with opponent melds. End on valid knock
// For OpponentKnock and LayOff, empty knock is valid
const TurnProgress = {
  OppositeDraw: -3,
  DealerDraw: -2,
  OppositeMustDraw: -1,
  Draw: 0,
  Middle: 1,
  StartKnock: 2,
  OpponentKnock: 3,
  LayOff: 4,
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
      // Player only needs to know and show their hand if not final phase of game
      // TODO: Check if opposite player has knocked. Will need to show
      var player_hand = [];
      var other_hand = [];
      var player_melds = [];
      var other_melds = [];

      var cur_player_name = player2_name.username;
      if (game.player1_id == game.turn) {
        cur_player_name = player1_name.username;
      }
      if (request.session.user_id == game.player1_id) {
        player_hand = game.hand1;
        other_hand = game.hand2;
        // melds are JSON object
        for (i = 0; i < game.melds1.length; i++) {
          player_melds.push(game.melds1[i]);
        }

        for (i = 0; i < game.melds2.length; i++) {
          other_melds.push(game.melds2[i]);
        }
      } else {
        player_hand = game.hand2;
        other_hand = game.hand1;
        for (i = 0; i < game.melds2.length; i++) {
          player_melds.push(game.melds2[i]);
        }

        for (i = 0; i < game.melds1.length; i++) {
          other_melds.push(game.melds1[i]);
        }
      }
      var top_card = game.discard[game.discard_index];

      console.log('Player melds: ', game.melds2);
      console.log('Player melds: ', player_melds);

      // Player shouldn't see any melds unless final phase
      if (game.turn_progress < TurnProgress.LayOff) {
        other_hand = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        other_melds = [];
        player_melds = [];
      }

      //   if(game.turn_progress < TurnProgress.OpponentKnock){
      // }

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
        opponent_hand: other_hand,
        melds: player_melds,
        opponent_melds: other_melds,
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

  // Check for first phase steps
  if (progress == TurnProgress.OppositeDraw) {
    new_progress = TurnProgress.DealerDraw;
  } else {
    if (progress == TurnProgress.DealerDraw) {
      new_progress = TurnProgress.OppositeMustDraw;
    }
  }

  // Handle swap from special knock phase
  if (progress == TurnProgress.StartKnock) {
    // Let non-Knocking player meld
    new_progress = TurnProgress.OpponentKnock;
  }

  console.log('Starting new turn with turn ', new_progress);

  await Games.start_new_turn(game.game_id, new_turn, new_progress);

  await emit_new_turn(io, game.game_id, p1 == new_turn, new_progress < -1);
};

// Check if allowed to draw from destination, draw, emit for updates
router.post('/:id/draw_deck', async (request, response, next) => {
  const io = request.app.get('io');

  const game_id = request.params.id;
  const player = request.session.user_id;
  const game = await Games.get_game_by_id(game_id);

  // Easy test for emit
  //await emit_reveal_all(io, game_id, game.player1_id, game.hand2, game.melds1, game.melds2)
  //await emit_reveal_all(io, game_id, game.player2_id, game.hand1, game.melds2, game.melds1)
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

  console.log('In draw discard with ', game.turn_progress);
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
  var index = -1;
  if (
    request.body.selected_cards != null &&
    request.body.selected_cards.length == 1
  ) {
    console.log('Body was not null, and body is length 1');
    index = request.body.selected_cards[0];
  }
  if (is_valid_access(game, player) == false) {
    response.send();

    response.status(403);
    return null;
  }

  // Special processing if Knock's discard
  if (
    game.turn_progress == TurnProgress.StartKnock &&
    index != -1 &&
    index < 11
  ) {
    console.log('Knock discard');
    await discard_knock(io, response, game_id, player, game, index);
    return null;
  }

  if (
    game.turn_progress == TurnProgress.Middle &&
    request.body.selected_cards != null &&
    index != -1
  ) {
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

// Handle discard for knock phase
// Makes sure index chosen is not a melded card
const discard_knock = async (io, response, game_id, player_id, game, index) => {
  var melds = null;
  var hand = null;
  var can_discard = true;
  if (player_id == game.player1_id) {
    melds = game.melds1;
    hand = game.hand1;
  } else {
    melds = game.melds2;
    hand = game.hand2;
  }

  for (i = 0; i < melds.length; i++) {
    for (j = 0; j < melds[i].length; j++) {
      var meld_values = cardID_to_hand(hand, melds[i]);
      // Card is in meld or doesn't exist, can't discard
      // Cards melded turn to 0 in the hand, so we check to make sure
      // they aren't trying to discard nothing
      if (hand[index] < 1) {
        can_discard = false;
        break;
      }
    }
  }

  if (can_discard == true) {
    await Games.discard_facedown(game, player_id, index);
    var game2 = await Games.get_game_by_id(game_id);
    await emit_discard_update(io, game_id, 0);
    var hand = game2.hand1;
    if (player_id == game.player2_id) {
      hand = game2.hand2;
    }
    await emit_hand_update(io, game_id, player_id, hand);
    console.log('Turn is ', game.turn_progress);
    // Player discarded facedown for their knock. Opponent must form melds now
    await swap_turn(game, io);
    response.send();
    response.status(200);
  } else {
    emit_error_message(
      io,
      player_id,
      `/games/${game_id}/${player_id}`,
      'Cannot discard card from meld'
    );
    response.send();
    response.status(403);
  }
};

// Emits to player what meld they just made
// Melds are client-side until send with knock, so they can refresh
// themselves by checking chat
router.post('/:id/meld', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  const player = request.session.user_id;
  const melds = request.body.string;

  const message = 'Indexes in melds: \n' + melds;
  const location = `/games/${game_id}/${player}`;

  await emit_notice(io, location, message);

  response.send();
  response.status(200);
});

// Check if allowed to meld, check for valid meld
router.post('/:id/knock', async (request, response, next) => {
  const io = request.app.get('io');
  const game_id = request.params.id;
  const player = request.session.user_id;
  var melds = request.body.melds;
  var game = await Games.get_game_by_id(game_id);
  var hand_after = null;
  var melds_to_save = null;

  //console.log("Melds are currently", game.melds1, " and ", game.melds2)
  //console.log("Melds are currently", game.melds2[0], game.melds2[0][1])

  if (is_valid_access(game, player) == false) {
    await emit_unselect_melds(io, game_id, player);

    response.send();

    response.status(403);
    return null;
  }

  if (
    game.turn_progress != TurnProgress.Middle &&
    game.turn_progress != TurnProgress.OpponentKnock
  ) {
    const location = `/games/${game_id}/${player}`;
    const message = 'Could not knock at this time';
    await emit_meld_update(io, location, message);
    await emit_unselect_melds(io, game_id, player);

    response.send();

    response.status(403);
    return null;
  }

  var total_melded_cards = 0;

  for (i = 0; i < melds.length; i++) {
    for (j = 0; j < melds[i].length; j++) {
      total_melded_cards = total_melded_cards + 1;
    }
  }

  if (total_melded_cards > 10) {
    const location = `/games/${game_id}/${player}`;
    const message = 'Cannot knock with more than 10 cards';
    await emit_meld_update(io, location, message);
    await emit_unselect_melds(io, game_id, player);

    response.send();

    response.status(403);
    return null;
  }

  const hand = await Games.get_hand_by_player(game_id, player);
  hand_after = hand;
  var meld_success = melds.length > 0;

  console.log('Checking knock');
  // Check all melds for validity
  if (has_dupes(melds) == true) {
    meld_success = false;

    // Empty meld succeeds automatically if OpponentKnock or LayOff phase
  } else if (
    melds.length == 0 &&
    (game.turn_progress == TurnProgress.OpponentKnock ||
      game.turn_progress == TurnProgress.LayOff)
  ) {
    meld_success = true;
    console.log('Knock with empty hand allowed');
  } else {
    for (var i = 0; i < melds.length; i++) {
      meld_success = is_valid_meld(hand, melds[i]);
      if (meld_success == false) {
        break;
      }
    }

    if (meld_success == true) {
      var result = remaining_deadwood(hand, melds);
      var deadwood = result[0];
      hand_after = result[1];
      melds_to_save = result[2];
      // Deadwood must be less than 10 points
      // If the non-Knocking player is melding here, they're allowed to have more deadwood
      if (deadwood > 60 && game.TurnProgress != TurnProgress.OpponentKnock) {
        // TODO: Don't forget to set this back down to 10
        const location = `/games/${game_id}/${player}`;
        const message = `Deadwood was not less than 10 (${deadwood})`;
        await emit_meld_update(io, location, message);
        await emit_unselect_melds(io, game_id, player);

        response.send();

        response.status(200);
        return null;
      }
    }
  }

  // Meld really succeeded, go into knock step
  if (meld_success == true) {
    if (hand_after == null) {
      console.log('Hand after discarding was null');
      // hand_after =
    }

    if (melds_to_save == null) {
      melds_to_save = [];
    }
    console.log("Melds we're saving: ", melds_to_save);

    await Games.save_meld(
      game,
      player,
      JSON.stringify(melds_to_save),
      hand_after
    );
    await emit_hand_update(io, game_id, player, hand_after);
    // Update local variable with current gamestate
    game = await Games.get_game_by_id(game_id);

    // var game2 = await Games.get_game_by_id(game_id);
    //console.log("Melds are currently", game2.melds1, " and ", game2.melds2)

    // Handle case of non-Knocking player validating melds
    if (game.turn_progress == TurnProgress.OpponentKnock) {
      const location = `/games/${game_id}/${player}`;
      const message = `Melds ${request.session.username} formed!`;
      await emit_meld_update(io, location, message);

      // Reveal all cards and melds, then let the non-Knocking player lay off deadwood
      await emit_reveal_all(
        io,
        game_id,
        game.player1_id,
        game.hand2,
        game.melds1,
        game.melds2
      );
      await emit_reveal_all(
        io,
        game_id,
        game.player2_id,
        game.hand1,
        game.melds2,
        game.melds1
      );

      await Games.set_turn_progress(game_id, TurnProgress.LayOff);
    } else {
      const location = `/games/${game_id}`;
      const message = `Player ${request.session.username} knocked!`;
      await emit_meld_update(io, location, message);
      await Games.set_turn_progress(game_id, TurnProgress.StartKnock);
    }
  } else {
    const location = `/games/${game_id}/${player}`;
    const message = 'Melds were not valid';
    await emit_meld_update(io, location, message);
  }

  await emit_unselect_melds(io, game_id, player);

  response.send();

  response.status(200);
});

const is_valid_meld = (hand, meld) => {
  const meldID = cardID_to_hand(hand, meld);
  if (!is_Enough_Meld(meldID)) {
    return false;
  }

  if (has_zeroes(meldID)) {
    return false;
  }

  if (
    !is_Ascending_Num(meldID) &&
    !is_Descending_num(meldID) &&
    !is_Same_Card_Different_Suite(meldID)
  ) {
    return false;
  }

  return true;
};

const has_zeroes = (meld) => {
  for (var i = 0; i < meld.length; i++) {
    console.log('Check ', meld[i]);
    if (meld[i] == 0) {
      console.log('Meld had blank');
      return true;
    }
  }

  return false;
};

const has_dupes = (melds) => {
  var nums = [];
  for (i = 0; i < melds.length; i++) {
    for (j = 0; j < melds[i].length; j++) {
      for (k = 0; k < nums.length; k++) {
        if (nums[k] == melds[i][j]) {
          return true;
        }
      }
      nums.push(melds[i][j]);
    }
  }

  return false;
};

// Check which cards are not in melds
// Add value of those cards and return it and the new hand in array
// Also returns new set of melds that match card value
const remaining_deadwood = (hand, melds_index) => {
  var melds = [];
  for (i = 0; i < melds_index.length; i++) {
    melds.push(cardID_to_hand(hand, melds_index[i]));
  }
  var hand_copy = hand;
  var deadwood = 0;

  for (i = 0; i < melds.length; i++) {
    for (j = 0; j < melds[i].length; j++) {
      for (k = 0; k < hand_copy.length; k++) {
        if (hand_copy[k] == melds[i][j]) {
          hand_copy[k] = 0;
        }
      }
    }
  }

  for (i = 0; i < hand_copy.length; i++) {
    deadwood = deadwood + Math.min(hand_copy[i] % 13, 10);
  }

  return [deadwood, hand_copy, melds];
};

const cardID_to_hand = (hand, meld) => {
  const meldArray = meld.map((index) => hand[index]);
  return meldArray;
};
const is_Enough_Meld = (meld) => {
  if (meld.length >= 3 && meld.length <= 10) {
    return true;
  } else {
    console.log('Meld too small');
    return false;
  }
};
// Ascending if value at i is value at i-1 +1
// Previous value+1 = value, and previous value is not % 13 = 0
// % 13 = 0 is a king, and nothing comes after
// Must be same suit, so also fail if some i > 0 comes to be ace
const is_Ascending_Num = (meld) => {
  for (let i = 1; i < meld.length; i++) {
    if (meld[i] % 13 == 1 || meld[i] !== meld[i - 1] + 1) {
      console.log('Meld not ascending');
      return false;
    }
  }

  console.log('Meld ascending');
  return true;
};

const is_Descending_num = (meld) => {
  for (let i = 1; i < meld.length; i++) {
    if (meld[i] % 13 == 0 || meld[i] !== meld[i - 1] - 1) {
      console.log('Meld not descending');
      return false;
    }
  }

  console.log('Meld descending');
  return true;
};
const is_Same_Suite = (meld) => {
  for (let i = 1; i < meld.length; i++) {
    if (meld[i] !== meld[0]) {
      console.log('Not same suite?');
      return false; // Found a different number, not all numbers are the same
    }
  }

  console.log('Same suite');
  return true;
};

const is_Same_Card_Different_Suite = (meld) => {
  for (let i = 1; i < meld.length; i++) {
    console.log(meld[i], meld[i - 1]);
    if (meld[i] % 13 != meld[i - 1] % 13) {
      console.log('Not same card');

      return false;
    }
  }

  console.log('Same card different suite');
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
  const timestamp = '';

  io.to(location).emit('chat-message-received', {
    message,
    username,
    timestamp,
  });
};

const emit_unselect_melds = async (io, game_id, player) => {
  console.log('Emit unselect melds');
  io.to(`/games/${game_id}/${player}`).emit('unselect-melds');
};

const emit_reveal_all = async (
  io,
  game_id,
  player,
  opponent_hand,
  player_meld,
  opponent_meld
) => {
  console.log('Emit reveal all');
  console.log('Hand: ', opponent_hand);
  console.log('Player meld: ', player_meld);
  console.log('Opponent_meld: ', opponent_meld);
  io.to(`/games/${game_id}/${player}`).emit('reveal-cards', {
    opponent_hand,
    player_meld,
    opponent_meld,
  });
};

const emit_error_message = async (io, player, location, message) => {
  console.log('Emitting ', message);
  const username = '!!ERROR!!';
  const timestamp = '';

  io.to(location).emit('chat-message-received', {
    message,
    username,
    timestamp,
  });
};

const emit_notice = async (io, location, message) => {
  console.log('Emitting ', message);
  const username = 'NOTICE: ';
  const timestamp = '';

  io.to(location).emit('chat-message-received', {
    message,
    username,
    timestamp,
  });
};

module.exports = router;
