const io = require("socket.io-client");
const socket = io();
const messageContainer = document.querySelector("#messages");

// From 4/17 section 1
socket.on("chat-message-received", ({username, message, timestamp}) => {
  const entry = document.createElement("div");


  const displayName = document.createElement("span");
  displayName.innerText = username;
  const displayMessage = document.createElement("span");
  displayMessage.innerText = message;
  const displayTimestamp = document.createElement("span");
  displayTimestamp.innerText = timestamp;

  entry.append(displayName, displayMessage, displayTimestamp)
 
  messageContainer.appendChild(entry)
})

socket.on("redirect-to-game", ({game_id}) =>{
    console.log("Socket caught it", game_id)
    window.location.href = `/games/${game_id}`
})

socket.on("player-joined-lobby", ({p2}) =>{
    const players_in_lobby = document.getElementsByClassName("player_names")
    if (players_in_lobby[1] != null){
        players_in_lobby[1].innerText = p2
    }

})

const start_button = document.getElementById("start-game-button")
// Send request to start game on start press
if (start_button != null && start_button.value != null){
    start_button.addEventListener("click", () => {
        fetch(`/games/${start_button.value}/start`, {
            method: "post", 
            headers: {"Content-Type": "application/json"},
          
        })
    })
    
}

const chat_box = document.querySelector("input#chat__message")
if (chat_box != null){
    chat_box.addEventListener("keydown", (event) => {
        if(event.keyCode !== 13){ // Return is 13
          return
        }
      
        const message = event.target.value;
        event.target.value = "";
        
        fetch("/chat/0", {
          method: "post", 
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({message }),
        
        })
    })
}
