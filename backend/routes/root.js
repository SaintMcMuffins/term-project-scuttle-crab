const express = require("express");
const router = express.Router();

router.get("/", (request, response) => {
    const name = "person";

    response.render("home.ejs", {
        title: "Home",
        message: "Gin Rummy: Home Page",
        username: request.session.username,
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