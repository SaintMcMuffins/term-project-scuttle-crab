const express = require("express");
const router = express.Router();

router.get("/", (request, response) => {
    const name = "person";
  
    response.render("home.ejs", {
        title: "Hi World!",
        message: "Our first template.",
      });
  });

router.post("/auth/login", (request, response) =>{
  console.log("Post request %s %s", request.body.username, request.body.password);

  response.redirect('/');
})



module.exports = router;