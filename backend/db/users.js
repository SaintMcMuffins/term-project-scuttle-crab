const db = require("./connections");

const create = (username, email, password) =>
    db.one("INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING user_id",[
        username, 
        email, 
        password,
        `${new Date().toLocaleDateString("en-us", {
            hour: "numeric",
            minute: "numeric",
            month: "short",
            day: "numeric",
            weekday: "long",
            year: "numeric",
          })}`
    ]);

    const findByEmail = email =>
    db.one("SELECT * FROM users WHERE email=$1", [email]);
    
    module.exports = {
        create,
        findByEmail
    };