const express = require("express");
const router = express.Router();

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

  router.get("/lobby", (request, response) => {
    const name = "person";
  
    response.render("lobby.ejs", {
        title: "Lobby",
        message: "Gin Rummy: Lobby",
        username: request.session.username,
      });
  });

  router.get("/joinGame", (request, response) => {
    const name = "person";
  
    response.render("joinGame.ejs", {
        title: "Join Game",
        message: "Gin Rummy: Join Game",
        username: request.session.username,
      });
  });

  router.get("/createGame", (request, response) => {
    const name = "person";
  
    response.render("createGame.ejs", {
        title: "Create Game",
        message: "Gin Rummy: Create Game",
        username: request.session.username,
      });
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