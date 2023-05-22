const db = require('../db/connections.js');

const createGameSQL =
  'INSERT INTO games (completed) VALUES (false) RETURNING *';
const insertFirstUserSQL =
  'INSERT INTO game_users (user_id, game_id, current_player) VALUES ($1, $2, true)';
const gamesListSQL = `SELECT g.id, g.created_at 
                      FROM games g, game_users gu 
                      WHERE g.id=gu.game_id AND gu.user_id != $1 AND 
                      (SELECT COUNT(*) FROM game_users WHERE game_users.game_id=g.id) = 1`;

const joinGameSQL = 'INSERT INTO game_users (game_id, user_id) VALUES ($1, $2)';

const join = (game_id, user_id) => db.none(joinGameSQL, [game_id, user_id]);

const state = async (game_id, user_id) => {
  try {
    const users = await db.many(
      `SELECT users.username, users.id AS user_id 
       FROM users, game_users 
       WHERE users.id=game_users.user_id AND game_users.game_id=$1 
       ORDER BY game_users.created_at`,
      [game_id]
    );
    users[0].letter = 'X';
    users[1].letter = 'Y';

    const board = await db.many(
      'SELECT user_id, x_coordinate, y_coordinate FROM game_moves WHERE game_id=$1',
      [game_id]
    );

    return {
      game_id,
      users,
      user_id,
      board,
    };
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get game state');
  }
};

const create = async (user_id) => {
  const new_game = await db.one(
    `INSERT into games (player1_id) VALUES ($1) RETURNING game_id`,
    [user_id]
  );
  return new_game;
};

const player1_of_game_id = async (game_id) => {
  const name = await db.one(
    `SELECT username FROM users WHERE user_id in (select player1_id from games WHERE game_id=$1)`,
    [game_id]
  );

  return name;
};

const player2_of_game_id = async (game_id) => {
  var name;
  try {
    name = await db.one(
      `SELECT username FROM users WHERE user_id in (select player2_id from games WHERE game_id=$1)`,
      [game_id]
    );
  } catch {
    return null;
  }

  return name;
};

const host_of_game_id = async (game_id) => {
  const id = await db.one(`SELECT player1_id FROM games WHERE game_id=$1`, [
    game_id,
  ]);

  return id;
};

const not_host_of_game_id = async (game_id) => {
  const id = await db.one(`SELECT player2_id FROM games WHERE game_id=$1`, [
    game_id,
  ]);

  return id;
};

// Checks game is not started
// Makes random deck, deals 10 cards to both players
// TODO: Choose first player, defaulting to P1 for now
// TODO: Take one card from deck to start discard, face up

// First turn then begins
// Let P2 choose to take discard card or not, start their turn
// If P2 passes without drawing, P1 has choice to take discard
// If P1 also passes, game begins as normal with P2 turn

// Sets game turn above -1, to mark started
const start_game = async (game_id) => {
  const status = await db.one(`SELECT turn FROM games WHERE game_id=$1`, [
    game_id,
  ]);

  const p2 = await not_host_of_game_id(game_id);

  // Check if game not started
  console.log('Game status is ', status.turn);
  if (status.turn == -1 && p2.player2_id != null) {
    await shuffle_deck(game_id);
    await deal_hands(game_id);
    await discard_from_deck(game_id);

    // Start game with turn = player2 ID, and also set turn progress to -3
    // See enum in frontend > games
    await db.none(
      `UPDATE games SET turn=$1, turn_progress=$2 WHERE game_id=$3`,
      [p2.player2_id, -3, game_id]
    );
  }
};

const join_game = async (game_id, user_id) => {
  const player2 = await db.one(
    `SELECT player2_id FROM games WHERE game_id=$1`,
    [game_id]
  );

  // Check if game has empty slot
  if (player2.player2_id == null) {
    await db.none(`UPDATE games SET player2_id=$1 WHERE game_id=$2`, [
      user_id,
      game_id,
    ]);
  }
};

const get_game_by_id = async (game_id) => {
  try {
    const game = await db.one(`SELECT * FROM games WHERE game_id=$1`, [
      game_id,
    ]);
    return game;
  } catch {
    console.log('Game does not exist');
    return null;
  }
};

const find_open_game = async () => {
  try {
    const game = await db.one(
      `SELECT * FROM games WHERE player2_id IS NULL LIMIT 1`
    );

    return game;
  } catch {
    console.log('No open games');
    return null;
  }
};

const shuffle_deck = async (game_id) => {
  try {
    var cards = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    ];

    var deck = [];

    var card = 0;
    var draw = 0;
    var first_card = 0;
    for (i = 0; i < 52; i++) {
      draw = Math.floor(Math.random() * (52 - i));
      // Swap position so we can pop and shift
      card = cards[draw];
      first_card = cards[0];
      cards[0] = card;
      cards[draw] = first_card;

      deck.push(cards.shift());
    }

    await db.none(`UPDATE games SET deck=$1 WHERE game_id=$2`, [deck, game_id]);
  } catch {}
};

// Pull player id's hand and the deck, then shift to hand
// Since post request can call this, check if game is started first
const draw_card = async (game_id, player_id, draw_count) => {
  if (draw_count == null) {
    draw_count = 1;
  }
  var player = await host_of_game_id(game_id);
  var info = null;
  var hand = null; // Hand will be separate, so we don't guess between hand1 and hand2
  if (player.player1_id == player_id) {
    info = (
      await db.many(
        `SELECT deck, hand1, deck_index FROM games WHERE game_id=$1`,
        [game_id]
      )
    )[0];
  } else {
    console.log('Player is not host');
    player = await not_host_of_game_id(game_id);
    if (player.player2_id != null && player.player2_id == player_id) {
      info = (
        await db.many(
          `SELECT deck, hand2, deck_index FROM games WHERE game_id=$1`,
          [game_id]
        )
      )[0];
    }
  }

  if (info != null) {
    if (info.hand1 != null) {
      hand = info.hand1;
    } else {
      hand = info.hand2;
    }

    var did_draw = false;

    for (i = 0; i < draw_count; i++) {
      // Pop card from deck, place into first blank in hand
      // Does  not draw if hand is full
      for (i = 0; i < hand.length; i++) {
        if (hand[i] == 0) {
          hand[i] = info.deck.pop();
          did_draw = true;
          break;
        }
      }

      if (did_draw == true) {
        if (info.hand1 != null) {
          await db.none(`UPDATE games SET hand1=$1 WHERE game_id=$2`, [
            hand,
            game_id,
          ]);
        } else {
          await db.none(`UPDATE games SET hand2=$1 WHERE game_id=$2`, [
            hand,
            game_id,
          ]);
        }

        await db.none(`UPDATE games SET deck=$1 WHERE game_id=$2`, [
          info.deck,
          game_id,
        ]);
      }
      did_draw = false;
    }
  }
};

// Pull player id's hand and the discard pile, then move cards
const draw_from_discard = async (game_id, player_id) => {
  var player = await host_of_game_id(game_id);
  var info = null;
  var hand = null; // Hand will be separate, so we don't guess between hand1 and hand2
  if (player.player1_id == player_id) {
    info = (
      await db.many(
        `SELECT discard, hand1, discard_index FROM games WHERE game_id=$1`,
        [game_id]
      )
    )[0];
  } else {
    console.log('Player is not host');
    player = await not_host_of_game_id(game_id);
    if (player.player2_id != null && player.player2_id == player_id) {
      info = (
        await db.many(
          `SELECT discard, hand2, discard_index FROM games WHERE game_id=$1`,
          [game_id]
        )
      )[0];
    }
  }

  if (info != null) {
    if (info.hand1 != null) {
      hand = info.hand1;
    } else {
      hand = info.hand2;
    }

    // Grab card, then zero out and decrement index
    var card = info.discard[info.discard_index];
    info.discard[info.discard_index] = 0;
    var new_index = info.discard_index - 1;

    var did_draw = false;

    // Does  not draw if hand is full
    for (i = 0; i < hand.length; i++) {
      if (hand[i] == 0) {
        hand[i] = card;
        did_draw = true;
        break;
      }
    }

    if (did_draw == true) {
      if (info.hand1 != null) {
        await db.none(`UPDATE games SET hand1=$1 WHERE game_id=$2`, [
          hand,
          game_id,
        ]);
      } else {
        await db.none(`UPDATE games SET hand2=$1 WHERE game_id=$2`, [
          hand,
          game_id,
        ]);
      }

      await db.none(
        `UPDATE games SET discard=$1, discard_index=$2 WHERE game_id=$3`,
        [info.discard, new_index, game_id]
      );
    }

    return info.discard[info.discard_index];
  }
};

// Gives 10 cards from deck to each player
// Calls draw_card
const deal_hands = async (game_id) => {
  var game = await get_game_by_id(game_id);

  await draw_card(game_id, game.player1_id, 10);
  await draw_card(game_id, game.player2_id, 10);
};

const discard_from_deck = async (game_id) => {
  var game = await get_game_by_id(game_id);

  console.log(deck);
  console.log(discard);
  console.log(index);
  var deck = game.deck;
  var discard = game.discard;
  // Increasing before setting. Pile has 53 cards, so index 0 is no card
  var index = game.discard_index + 1;

  discard[index] = deck.pop();

  await db.none(
    `UPDATE games SET deck=$1, discard=$2, discard_index=$3 WHERE game_id=$4`,
    [deck, discard, index, game_id]
  );

  game = await get_game_by_id(game_id);
  console.log('\n\nUPDATE:\n\n');
  console.log(deck);
  console.log(discard);
  console.log(index);
};

const discard_from_hand = async (game_id, player_id, index) => {
  var game = await get_game_by_id(game_id);

  console.log(player_id, index);
  var new_index = game.discard_index + 1;
  var hand = await get_hand_by_player(game_id, player_id);
  console.log(hand);

  game.discard[new_index] = hand[index];

  hand[index] = 0;

  if (player_id == game.player1_id) {
    await db.none(
      `UPDATE games SET discard=$1, hand1=$2, discard_index=$3 WHERE game_id=$4`,
      [game.discard, hand, new_index, game_id]
    );
  } else {
    await db.none(
      `UPDATE games SET discard=$1, hand2=$2, discard_index=$3 WHERE game_id=$4`,
      [game.discard, hand, new_index, game_id]
    );
  }

  return game.discard[new_index];
};

const is_game_started = async (game_id) => {
  try {
    const turn = await db.one(`SELECT turn FROM games WHERE game_id=$1`, [
      game_id,
    ]);

    return turn.turn != -1;
  } catch {
    return false;
  }
};

const start_new_turn = async (game_id, new_turn, turn_progress) => {
  await db.none(`UPDATE games SET turn=$1, turn_progress=$2 WHERE game_id=$3`, [
    new_turn,
    turn_progress,
    game_id,
  ]);
};

const get_hand_by_player = async (game_id, player_id) => {
  const info = await db.one(
    `SELECT player1_id, player2_id, hand1, hand2 FROM games WHERE game_id=$1`,
    [game_id]
  );

  if (info.player1_id == player_id) {
    return info.hand1;
  } else {
    return info.hand2;
  }
};

const set_turn_progress = async (game_id, progress) => {
  await db.none(`UPDATE games SET turn_progress=$1 WHERE game_id=$2`, [
    progress,
    game_id,
  ]);
};

module.exports = {
  createGameSQL,
  insertFirstUserSQL,
  gamesListSQL,
  joinGameSQL,
  join,
  state,
  create,
  player1_of_game_id,
  player2_of_game_id,
  host_of_game_id,
  not_host_of_game_id,
  get_hand_by_player,
  start_game,
  join_game,
  get_game_by_id,
  find_open_game,
  shuffle_deck,
  deal_hands,
  draw_card,
  draw_from_discard,
  discard_from_hand,
  set_turn_progress,
  start_new_turn,
};
