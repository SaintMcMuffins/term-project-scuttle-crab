const io = require('socket.io-client');
const socket = io();
const messageContainer = document.querySelector('#messages');

// From 4/17 section 1
socket.on('chat-message-received', ({ username, message, timestamp }) => {
  const entry = document.createElement('div');

  const displayName = document.createElement('span');
  displayName.innerText = username;
  // Add space between username and message
  const usernameMessageSpace = document.createElement('span');
  usernameMessageSpace.innerText = ' | ';
  const displayMessage = document.createElement('span');
  displayMessage.innerText = message;
  // Add space between message and timestamp
  const messageTimestampSpace = document.createElement('span');
  messageTimestampSpace.innerText = ' | ';
  const displayTimestamp = document.createElement('span');
  displayTimestamp.innerText = timestamp;

  entry.append(
    displayName,
    usernameMessageSpace,
    displayMessage,
    messageTimestampSpace,
    displayTimestamp
  );

  messageContainer.appendChild(entry);
});

socket.on('redirect-to-game', ({ game_id }) => {
  console.log('Socket caught it', game_id);
  window.location.href = `/games/${game_id}`;
});

socket.on('player-joined-lobby', ({ p2 }) => {
  const players_in_lobby = document.getElementsByClassName('player_names');
  if (players_in_lobby[1] != null) {
    players_in_lobby[1].innerText = p2;
  }
});

socket.on('update-hand', ({ hand }) => {
  var handElement = document.getElementsByClassName('p1-item');
  for (var i = 0; i < handElement.length; i++) {
    var cardElement = handElement[i];
    if (i < hand.length) {
      cardElement.id = 'card' + hand[i]; // update card id
    }
  }
});

socket.on('update-turn', ({ player, is_passable_turn }) => {
  var playerElement = document.querySelector('.player-turn-indicator');
  playerElement.innerHTML = player + "'s turn!";

});

socket.on('update-discard-pile', ({ discard_top }) => {
  var discardPileElement = document.getElementsByClassName("pile")[0];
  discardPileElement.id = 'card' + discard_top; // update top card id
});

const start_button = document.getElementById('start-game-button');
// Send request to start game on start press
if (start_button != null && start_button.value != null) {
  start_button.addEventListener('click', () => {
    fetch(`/games/${start_button.value}/start`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

const chat_box = document.querySelector('input#chat__message');
if (chat_box != null) {
  chat_box.addEventListener('keydown', (event) => {
    if (event.keyCode !== 13) {
      // Return is 13
      return;
    }

    const message = event.target.value;
    event.target.value = '';

    fetch('/chat/0', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  });
}

const pass_button = document.getElementById('pass-button');
if (pass_button != null && pass_button.value != null) {
  pass_button.addEventListener('click', () => {
    fetch(`/games/${pass_button.value}/end_turn`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },

    });
  });
}

// puts clicked cards into an array to be checked if meld possible or not
const select_card = document.querySelectorAll('.p1-item');
var selected_cards = [];
var melds = [];
var draw_pile = [10];

select_card.forEach((card) => {
  card.addEventListener('click', (event) => {
    const clickedCard = event.target;
    const cardIndex = Array.from(select_card).indexOf(clickedCard);

    if (selected_cards.includes(cardIndex)) {
      // Card is already selected, remove highlight
      clickedCard.classList.remove('highlighted');
      const selectedIndex = selected_cards.indexOf(cardIndex);
      selected_cards.splice(selectedIndex, 1);
    } else {
      // Card is not selected, add highlight
      clickedCard.classList.add('highlighted');
      selected_cards.push(cardIndex);
    }

    console.log('Cards you selected:', selected_cards);
  });
});

const discard_button = document.getElementById('discard-button');
if (discard_button != null && discard_button.value != null) {
  discard_button.addEventListener('click', () => {
    fetch(`/games/${discard_button.value}/discard`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_cards }),
    });
  });
}

const meld_button = document.getElementById('meld-button');
if (meld_button != null && meld_button.value != null) {
  meld_button.addEventListener('click', () => {
    if (selected_cards.length > 0){
        // Push to melds and reset selected
        console.log("Pushing ", selected_cards)
        melds.push(selected_cards)
        console.log("Have meld ", melds)

        for(var i=0; i < selected_cards.length; i++){
            select_card[selected_cards[i]].classList.add('melded');
            select_card[selected_cards[i]].classList.remove('highlighted');

        }

        selected_cards = []

        const string = melds.toString()
        fetch(`/games/${meld_button.value}/meld`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ string }),
            
          });
    }else{
        console.log("Tried to push nothing!")

    }

   // fetch(`/games/${meld_button.value}/meld`, {
     // method: 'post',
     // headers: { 'Content-Type': 'application/json' },
     // body: JSON.stringify({ selected_cards }),
    //});
  });
}
const draw_card = document.getElementById('draw-card');
if (draw_card != null && draw_card.value != null) {
  draw_card.addEventListener('click', () => {
    fetch(`/games/${draw_card.value}/draw_deck`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_pile }),
      
    });
    console.log('Drew:', draw_pile);
  });
}

const draw_discard = document.getElementsByClassName("pile");
// Wasn't reading div value, so using draw card value
if (draw_discard.length != 0 && draw_card != null & draw_card.value != null) {
  if(draw_card.value != null && draw_card.value >= 0){
    draw_discard[0].addEventListener('click', () => {
        console.log("Click")
        fetch(`/games/${draw_card.value}/draw_discard`, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          
        });
      });
  }
  
}

const knock_button = document.getElementById('knock-button');
if (knock_button != null && knock_button.value != null) {
  knock_button.addEventListener('click', () => {
    fetch(`/games/${knock_button.value}/knock`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ melds }),
    });
    console.log('Cards you are melding:', melds);
  });
}

socket.on('unselect-melds', () => {
  for(var i=0; i < melds.length; i++){
    for(var j=0; j < melds[i].length; j++){
      select_card[melds[i][j]].classList.remove("melded")
    }
  }

  melds = []

});
// TODO: meld validation from selected cards & emit
