const express = require("express");
const router = express.Router();
const Games = require("../db/games.js")
router.post("/:id/start", async (request, response, next) => {
    const io = request.app.get("io");
    const game_id = request.params.id
    console.log("\nGot the request\n")
    console.log(game_id)
    const host = await Games.host_of_game_id(game_id)
    console.log("In post")
    const p2 = await Games.not_host_of_game_id(game_id)
    console.log(host.player1_id, request.session.user_id, p2)
    if (host.player1_id == request.session.user_id && p2.player2_id != null){
        await Games.start_game(game_id)
        console.log("Redirecting to game")

       // response.status(302);
        const io = request.app.get("io")
        io.to(`/lobby/${request.params.id}/${host.player1_id}`).emit("redirect-to-game",{
            game_id
        })

        io.to(`/lobby/${request.params.id}/${p2.player2_id}`).emit("redirect-to-game",{
            game_id
        })
        
        response.send()

    
    }else{
        console.log("Person who tried to start was not host, or p2 doesn't exist")
        response.status(204)
        response.send()

    }
    
})

// Check if game exists, then check if player is in game, else redirect home
router.get("/:id", async (request, response, next) => {
    const game_id = request.params.id
    console.log("In get for game id", game_id)
    const game = await Games.get_game_by_id(game_id)
    
    const player1_name = await Games.player1_of_game_id(request.params.id);
    const player2_name = await Games.player2_of_game_id(request.params.id);

    if (game != null && request.session.user_id != null && game.turn != -1){
        if(game.player1_id == request.session.user_id || (game.player2_id != null && game.player2_id == request.session.user_id)){
            console.log("Should render")

            // Player only needs to know their own hand
            // TODO: Check if opposite player has knocked. Will need to show
            var player_hand = null
            if (request.session.user_id == game.player1_id){
                player_hand = game.hand1
            }else{
                player_hand = game.hand2
            }
            response.render("game.ejs", {
                title: "Game",
                roomname: game.game_id,
                players: [player1_name.username, player2_name.username],
                turn: game.turn,
                message: "Gin Rummy: Game",
                player1: game.player1_id,
                player2: game.player2_id,
                hand: player_hand,
                loggedIn: true
              });


        }else{ // Player tried to access game, but is not in game
            console.log("Player tried to join game they aren't in")
            response.redirect("/")
        }

    }else{ // Game does not exist or player not user, or game not started, redirect home
        console.log("Player tried to join game that doesn't exist or was not started")
        response.redirect("/")
    }


    
})


module.exports = router;