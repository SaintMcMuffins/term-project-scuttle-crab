const db = require("../db/connections.js");

const createGameSQL = "INSERT INTO games (completed) VALUES (false) RETURNING *";
const insertFirstUserSQL = "INSERT INTO game_users (user_id, game_id, current_player) VALUES ($1, $2, true)";
const gamesListSQL = `SELECT g.id, g.created_at 
                      FROM games g, game_users gu 
                      WHERE g.id=gu.game_id AND gu.user_id != $1 AND 
                      (SELECT COUNT(*) FROM game_users WHERE game_users.game_id=g.id) = 1`;

const joinGameSQL = "INSERT INTO game_users (game_id, user_id) VALUES ($1, $2)";

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
    users[0].letter = "X";
    users[1].letter = "Y";
  
    const board = await db.many(
      "SELECT user_id, x_coordinate, y_coordinate FROM game_moves WHERE game_id=$1",
      [game_id]
    );
    
    return {
      game_id,
      users,
      user_id,
      board
    };
  } catch (error) {
    console.log(error);
    throw new Error("Failed to get game state");
  }
};

const create = async (user_id) =>{
    const new_game = await db.one(
        `INSERT into games (player1_id) VALUES ($1) RETURNING game_id`,
        [user_id]
    );
    return new_game
}

const player1_of_game_id = async (game_id) =>{
    const name = await db.one(
        `SELECT username FROM users WHERE user_id in (select player1_id from games WHERE game_id=$1)`,
        [game_id]

    )

    return name
}

const player2_of_game_id = async (game_id) =>{
    try{
        const name = await db.one(
            `SELECT username FROM users WHERE user_id in (select player2_id from games WHERE game_id=$1)`,
            [game_id]
    
        )
    }catch{
        return null
    }
    

    return name
}

const host_of_game_id = async (game_id) =>{
    const id = await db.one(
        `SELECT player1_id FROM games WHERE game_id=$1`,
        [game_id]

    )

    return id
}

const not_host_of_game_id = async (game_id) =>{
    const id = await db.one(
        `SELECT player2_id FROM games WHERE game_id=$1`,
        [game_id]

    )

    return id
}

const start_game = async (game_id) =>{
    const status = await db.one(
        `SELECT turn FROM games WHERE game_id=$1`,
        [game_id]
    )

    const p2 = await not_host_of_game_id(game_id)

    // Check if game not started
    console.log("Game status is ", status.turn)
    if(status.turn == -1 && p2.player2_id != null){
        await db.none(
            `UPDATE games SET turn=1 WHERE game_id=$1`,
            [game_id]
        )

    }
}

const join_game = async (game_id, user_id) =>{
    const player2 = await db.one(
        `SELECT player2_id FROM games WHERE game_id=$1`,
        [game_id]
    )

    // Check if game has empty slot
    if(player2.player2_id == null){
        await db.none(
            `UPDATE games SET player2_id=$1 WHERE game_id=$2`,
            [user_id, game_id]
        )
    }
}

const get_game_by_id = async (game_id) =>{
    try{
        const game = await db.one(
            `SELECT * FROM games WHERE game_id=$1`,
            [game_id]
        )
        return game

    }catch{
        console.log("Game does not exist")
        return null
    }

}

const find_open_game = async () =>{
    try{
        const game = await db.one(
            `SELECT * FROM games WHERE player2_id IS NULL LIMIT 1`
        )

        return game
    }catch{
        console.log("No open games")
        return null
    }
}

const shuffle_deck = async(game_id) =>{
    try{
        var cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
            31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
            51, 52]

        var deck = []
            
        var card = 0
        var draw = 0
        var first_card = 0
        for (i=0; i < 52; i++){
            draw = Math.floor(Math.random() * (52-i))
            // Swap position so we can pop and shift
            card = cards[draw]
            first_card = cards[0]
            cards[0] = card
            cards[draw] = first_card

            deck.push(cards.shift())
        }

        await db.none(
            `UPDATE games SET deck=$1 WHERE game_id=$2`,
            [deck, game_id]
        )
    }catch{

    }
}


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
  start_game,
  join_game,
  get_game_by_id,
  find_open_game,

  shuffle_deck
};
