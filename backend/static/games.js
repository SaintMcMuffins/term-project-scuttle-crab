const express = require("express");
const router = express.Router();
const Games = require("../db/games.js")
router.post("/:id/start", async (request, response, next) => {
    console.log("\nGot the request\n")
    const io = request.app.get("io");
    const game_id = request.params.id
    const host = await Games.host_of_game_id(game_id)
    console.log("In post")
    console.log(host.player1_id, request.session.user_id)
    if (host.player1_id == request.session.user_id){
        await Games.start_game(game_id)

        io.emit("redirect-to-game", {
            game_id
        });
    
    //    response.send()
    
    
       // response.status(200);
    }else{
        console.log("Person who tried to start was not host, or p2 doesn't exist")
        response.status(204)
        response.send()

    }
    
})

module.exports = router;