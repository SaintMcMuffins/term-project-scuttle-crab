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

module.exports = {
  createGameSQL,
  insertFirstUserSQL,
  gamesListSQL,
  joinGameSQL,
  join,
  state
};
