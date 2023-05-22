/* eslint-disable camelcase */

exports.shorthands = undefined;

/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    pgm.createTable("games", {
      // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
      game_id: "id",
      turn: {
        type: "integer",
        notNull: true,
        default: -1
      },
      turn_progress: {
        type: "integer",
        notNull: true,
        default: -1
      },
      complete: {
        type: "boolean",
        default: false
      },
      player1_id: {
        type: "integer",
        notNull: true
      },
      player1_points: {
        type: "integer",
        default: 0
      },
      player2_points: {
        type: "integer",
        default: 0
      },
      player2_id: {
        type: "integer",
        default: null
      },
      hand1: {
        type: "integer[11]",
        notNull: true,
        default: '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}'
      },
      hand2: {
        type: "integer[11]",
        notNull: true,
        default: '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}'
      },
      deck: {
        type: "integer[52]",
        notNull: true,
        default: '{}'
      },
      deck_index: {
        type: "integer",
        default: 0,
        notNull: true
      },
      discard: {
        type: "integer[53]",
        notNull: true,
        default: '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}'
      },
      discard_index: {
        type: "integer",
        default: 0,
        notNull: true
      }


      
    });

    pgm.createTable("cards", {
        // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
        card_id: {
          type: "integer",
          primaryKey: true
        },
        value: {
          type: "integer"
        },
        suit: {
          type: "integer"
        }
  
      });
  
      pgm.sql("insert into cards values (1, 1, 1)")
      pgm.sql("insert into cards values (2, 2, 1)")
      pgm.sql("insert into cards values (3, 3, 1)")
      pgm.sql("insert into cards values (4, 4, 1)")
      pgm.sql("insert into cards values (5, 5, 1)")
      pgm.sql("insert into cards values (6, 6, 1)")
      pgm.sql("insert into cards values (7, 7, 1)")
      pgm.sql("insert into cards values (8, 8, 1)")
      pgm.sql("insert into cards values (9, 9, 1)")
      pgm.sql("insert into cards values (10, 10, 1)")
      pgm.sql("insert into cards values (11, 10, 1)")
      pgm.sql("insert into cards values (12, 10, 1)")
      pgm.sql("insert into cards values (13, 10, 1)")
  
      pgm.sql("insert into cards values (14, 1, 2)")
      pgm.sql("insert into cards values (15, 2, 2)")
      pgm.sql("insert into cards values (16, 3, 2)")
      pgm.sql("insert into cards values (17, 4, 2)")
      pgm.sql("insert into cards values (18, 5, 2)")
      pgm.sql("insert into cards values (19, 6, 2)")
      pgm.sql("insert into cards values (20, 7, 2)")
      pgm.sql("insert into cards values (21, 8, 2)")
      pgm.sql("insert into cards values (22, 9, 2)")
      pgm.sql("insert into cards values (23, 10, 2)")
      pgm.sql("insert into cards values (24, 10, 2)")
      pgm.sql("insert into cards values (25, 10, 2)")
      pgm.sql("insert into cards values (26, 10, 2)")
  
      pgm.sql("insert into cards values (27, 1, 3)")
      pgm.sql("insert into cards values (28, 2, 3)")
      pgm.sql("insert into cards values (29, 3, 3)")
      pgm.sql("insert into cards values (30, 4, 3)")
      pgm.sql("insert into cards values (31, 5, 3)")
      pgm.sql("insert into cards values (32, 6, 3)")
      pgm.sql("insert into cards values (33, 7, 3)")
      pgm.sql("insert into cards values (34, 8, 3)")
      pgm.sql("insert into cards values (35, 9, 3)")
      pgm.sql("insert into cards values (36, 10, 3)")
      pgm.sql("insert into cards values (37, 10, 3)")
      pgm.sql("insert into cards values (38, 10, 3)")
      pgm.sql("insert into cards values (39, 10, 3)")
  
      pgm.sql("insert into cards values (40, 1, 4)")
      pgm.sql("insert into cards values (41, 2, 4)")
      pgm.sql("insert into cards values (42, 3, 4)")
      pgm.sql("insert into cards values (43, 4, 4)")
      pgm.sql("insert into cards values (44, 5, 4)")
      pgm.sql("insert into cards values (45, 6, 4)")
      pgm.sql("insert into cards values (46, 7, 4)")
      pgm.sql("insert into cards values (47, 8, 4)")
      pgm.sql("insert into cards values (48, 9, 4)")
      pgm.sql("insert into cards values (49, 10, 4)")
      pgm.sql("insert into cards values (50, 10, 4)")
      pgm.sql("insert into cards values (51, 10, 4)")
      pgm.sql("insert into cards values (52, 10, 4)")

    
  };

  
  /**
   * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
   */
  exports.down = (pgm) => {
    pgm.dropTable("cards")
    pgm.dropTable("games")
  };