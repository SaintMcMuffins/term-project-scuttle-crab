const express = require("express");
const router = express.Router();

router.get("/", (request, response) => {
    const name = "person";
  
    response.send(
      `<html><head><title>Hello</title><body><p>Hello ${name} html!</p></html>`
    );
  });
module.exports = router;