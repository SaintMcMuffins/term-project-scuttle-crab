const express = require("express");
const router = express.Router();
const Games = require("../db/games.js")

router.get("/", (request, response) => {
    const name = "person";
    const loggedIn = request.session.username ? true : false;

    response.render("home.ejs", {
        title: "Home",
        message: "Gin Rummy: Home Page",
        username: request.session.username,
        loggedIn: loggedIn,
    });
});


router.get("/login", (request, response) => {
    const name = "person";
  
    response.render("login.ejs", {
        title: "Login",
        message: "Gin Rummy: Login",
      });
  });

  router.get("/register", (request, response) => {
    const name = "person";
  
    response.render("register.ejs", {
        title: "Register",
        message: "Gin Rummy: Register",
      });
  });

  router.get("/lobby/:id", async (request, response) => {
    var player1_name, player2_name
    try{
        player1_name = await Games.player1_of_game_id(request.params.id)
        host = await Games.host_of_game_id(request.params.id)
        try{
            player2_name = await Games.player2_of_game_id(request.params.id)

        }catch {// Player2 not in game yet, returned nothing on query
            player2_name = {username: ""}
        }

        console.log(player1_name.username, player2_name.username)
        response.render("lobby.ejs", {
            title: "Lobby",
            roomname: request.params.id,
            host: player1_name.username,
            players: [player1_name.username, player2_name.username],
            ishost: (request.session.user_id == host.player1_id),
            message: "Gin Rummy: Lobby",
            username: request.session.username,
          });
    } catch(error) {
        console.log({ error })
        response.redirect("/")
    }

    
  });

  router.get("/joinGame", (request, response) => {
    const name = "person";
  
    response.render("joinGame.ejs", {
        title: "Join Game",
        message: "Gin Rummy: Join Game",
        username: request.session.username,
      });
  });



  router.get("/creategame", async (request, response) => {
    const io = request.app.get("io");
  
    try {
      const {game_id} = await Games.create(request.session.user_id);
        console.log(game_id)
     // io.emit(GAME_CREATED, { game_id, created_at });
      response.redirect(`/lobby/${game_id}`);
    } catch (error) {
      console.log({ error });
  
      response.redirect("/");
    }
  });

  router.get("/rules", (request, response) => {
    const name = "person";
  
    response.render("rules.ejs", {
        title: "Rules",
        message: "Gin Rummy: Rules",
      });
  });

  router.get("/cards", (request, response) => {
    const name = "person";
  
    response.render("cardsTest.ejs", {
        title: "CardsTest",
        message: "Gin Rummy: Lobby",
      });
  });







module.exports = router;