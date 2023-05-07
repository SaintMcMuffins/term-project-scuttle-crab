//const express = require("express");
//const router = express.Router();
const db = require("../db/connections.js");


// TODO: Content may need to be filtered to avoid SQL injection

/*
    Puts message in DB messages table with ID
    and given content. Also uses current time

    Call by importing this file and then using 
    post_message(<session id>, <string content from input>)
*/
const post_message = async (poster_id, content) => {
    console.log("Posting message");
    console.log(poster_id);
    console.log(content);
  
    await db.any(`INSERT INTO messages ("poster_id", "content", "created_at") VALUES ($1, $2, $3)`,[
      poster_id,
      content,
      `${new Date().toLocaleDateString("en-us", {
        hour: "numeric",
        minute: "numeric",
        month: "short",
        day: "numeric",
        weekday: "long",
        year: "numeric",
      })}`,
  
    ])
    .catch((error) => {
      console.log({error});
      response.json({error});
    });
};

module.exports = post_message;