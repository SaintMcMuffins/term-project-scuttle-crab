const express = require("express");
const router = express.Router();

router.get("/", (request, response) => {
    const name = "person";

    response.render("home.ejs", {
        title: "Hi World!",
        message: "Our first template.",
    });
});


router.get("/login", (request, response) => {
    const name = "person";
  
    response.render("login.ejs", {
        title: "Hi World!",
        message: "Our first template.",
      });
  });

  router.get("/register", (request, response) => {
    const name = "person";
  
    response.render("register.ejs", {
        title: "Hi World!",
        message: "Our first template.",
      });
  });

router.post("/auth/login", (request, response) =>{
  console.log("Post request %s %s", request.body.username, request.body.password);

  response.redirect('/');
})




module.exports = router;