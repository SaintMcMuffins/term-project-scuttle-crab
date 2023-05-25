/* eslint-disable camelcase */

exports.shorthands = undefined;

/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable('games', {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    game_id: 'id',
    turn: {
      type: 'integer',
      notNull: true,
      default: -1,
    },
    turn_progress: {
      type: 'integer',
      notNull: true,
      default: -1,
    },
    complete: {
      type: 'boolean',
      default: false,
    },
    player1_id: {
      type: 'integer',
      notNull: true,
    },
    points: {
      type: 'integer',
      default: 0,
    },
    player2_id: {
      type: 'integer',
      default: null,
    },
    hand1: {
      type: 'integer[11]',
      notNull: true,
      default: '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    },
    hand2: {
      type: 'integer[11]',
      notNull: true,
      default: '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    },
    melds1: {
        type: 'json',
        notNull: true,
        default: '{}'
    },
    melds2: {
        type: 'json',
        notNull: true,
        default: '{}'
    },
    deck: {
      type: 'integer[52]',
      notNull: true,
      default: '{}',
    },
    deck_index: {
      type: 'integer',
      default: 0,
      notNull: true,
    },
    discard: {
      type: 'integer[53]',
      notNull: true,
      default:
        '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    },
    discard_index: {
      type: 'integer',
      default: 0,
      notNull: true,
    },
  });

  
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable('games');
};
