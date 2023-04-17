const express = require("express");
const bcrypt = require("bcrypt");
const Users = require("../../db/users");
const router = express.Router();

const SALT_ROUNDS = 10;

router.get("/register", (request, response) => {
    response.render("signup", { title: "Gin Rummy" });

});

router.get("/login", (request, response) => {
    response.render("login", { title: "Gin Rummy" });

});

router.post("/register", async (request, response) => {
    const {username, email, password } = request.body;

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);

    try {
        const {id} = await Users.create(username, email, hash);
    } catch(error) {
        response.render("signup", { title: "Gin Rummy", username, email, password, message: "Error",})
    }
    response.render("signup", { title: "Gin Rummy" });

});

router.post("/login", async (request, response) => {
    const { email, password} = request.body;
try {
    const user = await Useres.findByEmail(email);

    const isValidUser = await bcrypt.compare(password, user.password);
    if(isValidUser) {
        response.redirect("/lobby");
    } else {
        throw("User did not provide valid credentials");
    }
} catch(error) {
    response.render("login", { title: "Gin Rummy", email, message: "error" });
}





    response.render("login", { title: "Gin Rummy" });

});

module.exports = router;