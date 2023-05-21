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

socket.on("redirect-to-game", ({game_id, user_id}) =>{
    console.log("Socket caught it")
    window.location.href = `/game/${game_id}`
})

const start_button = document.getElementById("start-game-button")
if (start_button != null){
    start_button.addEventListener("click", () => {
        console.log("Click")
        fetch("/games/15/start", {
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
