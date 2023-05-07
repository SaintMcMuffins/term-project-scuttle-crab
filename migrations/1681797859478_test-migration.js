/* eslint-disable camelcase */

exports.shorthands = undefined;

/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    pgm.createTable("users", {
      // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
      user_id: "id",
      username: {
          type: "varchar(20)",
          notNull: true,
      
      },
      created_at: {
        type: "timestamp",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
      email: {
        type: "varchar(1000)",
        notNull: true,
      },
      password:{
          type: "varchar(80)",
          notNull: true,
      }
    });

    pgm.createTable("messages", {
        // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
        message_id: "id",
        poster_id: {
          type: "serial"
        },
        content: {
            type: "varchar(100)",
            notNull: true,
        
        },
        created_at: {
          type: "timestamp",
          notNull: true,
          default: pgm.func("current_timestamp"),
        },
       
    });
    
  //  pgm.addConstraint("messages", "poster_id", "foreignKey")
    pgm.addConstraint("messages", {
        type: "FOREIGN KEY",
        fields: ["poster_id"], //existing?
        name: "fk_poster_id",
        references: {
          table: "users", 
          field: "user_id",
        }, 
    },"FOREIGN KEY (poster_id) REFERENCES users (user_id)");
    
  };

  
  /**
   * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
   */
  exports.down = (pgm) => {
    pgm.dropTable("messages")
    pgm.dropTable("users")
  };