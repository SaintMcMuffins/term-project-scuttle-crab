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

document.querySelector("input#chat__message").addEventListener("keydown", (event) => {
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