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
  const players_in_lobby = document.getElementsByClassName('player_name_header');
  if (players_in_lobby[1] != null) {
    players_in_lobby[1].innerText = ("- " + p2);
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

socket.on('update-other-hand', ({ hand }) => {
    var handElement = document.getElementsByClassName('p2-item');
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

socket.on('game-over', ({ winner, final_points }) => {
    var playerElement = document.querySelector('.player-turn-indicator');
    playerElement.innerHTML = winner + " wins! " + final_points + " points";
  
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

// This will be null until Lay Off phase
var opponent_melds = document.getElementsByClassName("p2-meld-item")
var selected_meld = -1 // Index of selected meld to try to meld with

// Allows player to click on opponent melds to add them
// Click should highlight all melds of same group, and set selected_meld to ID
const set_meld_interactions = () =>{
    for(var i = 0; i < opponent_melds.length; i++){
        opponent_melds[i].addEventListener('click', (event) => {
            const meld_number = parseInt(event.target.classList[1]) // index of meld
            console.log("Selected is ", selected_meld)
            console.log("Selected is ", meld_number)

            if (selected_meld == meld_number) {
                // Unhighlight melds in same group as selected
                for(var i = 0; i < opponent_melds.length; i++){
                    if (parseInt(opponent_melds[i].classList[1]) == meld_number){
                        opponent_melds[i].classList.remove('highlighted')
                    }
                }

                selected_meld = -1
            } else {
                // Card is not selected, add highlight to same group
                for(var i = 0; i < opponent_melds.length; i++){
                    if (parseInt(opponent_melds[i].classList[1]) == meld_number){
                        opponent_melds[i].classList.add('highlighted')
                    }
                }

                selected_meld = meld_number
            }
        
         //   console.log('Cards you selected:', selected_meld);
           console.log(JSON.stringify({ melds, selected_meld }))
        });
    }
}

set_meld_interactions()

const meld_button = document.getElementById('meld-button');
if (meld_button != null && meld_button.value != null) {
  meld_button.addEventListener('click', () => {
    // Push to melds and reset selected
    if (selected_cards.length > 0){
        console.log("Pushing ", selected_cards)
        console.log("Have meld ", melds)

        for(var i=0; i < selected_cards.length; i++){
            select_card[selected_cards[i]].classList.add('melded');
            select_card[selected_cards[i]].classList.remove('highlighted');

        }

        // In Lay Off phase, can select a meld. Will push meld index to set
        // *-1 will be used to signify that this is a meld and needs to be fetched
            // -1 to avoid 0
        if(selected_meld != -1){
            for(var i = 0; i < opponent_melds.length; i++){
                if (parseInt(opponent_melds[i].classList[1]) == selected_meld){
                    opponent_melds[i].classList.add('melded')
                }
            }

            selected_cards.push((selected_meld+1)*-1)
        }

        melds.push(selected_cards)

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
      // We may have negative number to indicate meld with a meld. Handle
      if(melds[i][j] < 0){
        var index = Math.abs(melds[i][j])-1 // Revert conversion used to indicate meld
        for(var k = 0; k < opponent_melds.length; k++){
            if (parseInt(opponent_melds[k].classList[1]) == index){
                opponent_melds[k].classList.remove('melded')
            }
        }
      }else{
        select_card[melds[i][j]].classList.remove("melded")
      }
    }
  }

  melds = []

});


// Find opponent hand cards, set their ID
// For each meld in each melds, place div on game field, plus some divider to make melds obvious
socket.on("reveal-cards", (opponent_hand, player_meld, opponent_meld) =>{
    console.log("Trying to reveal cards")

    player_meld = opponent_hand.player_meld
    opponent_meld = opponent_hand.opponent_meld
    opponent_hand = opponent_hand.opponent_hand
    // Reveal opponent's cards
    const hand_element = document.getElementsByClassName('p2-item');


    for (var i = 0; i < hand_element.length; i++) {
        var cardElement = hand_element[i];
        if (i < opponent_hand.length) {
            cardElement.id = 'card' + opponent_hand[i]; // update card id
        }
    }

    // Get card area div to append to
    var card_area = document.getElementsByClassName('card-area')
    if(card_area != null){
        card_area = card_area[0]
    }else{
        console.log("Couldn't get card area")

    }

    for(var i = 0; i < player_meld.length; i++){
        for(var j = 0; j < player_meld[i].length; j++){
            var card = document.createElement('div');
            card.classList.add("p1-meld-item")
            card.id = "card" + player_meld[i][j]
            card_area.appendChild(card)
        }

        var card = document.createElement('div');
        card.classList.add("blank1")
        card_area.appendChild(card)
    }

    for(var i = 0; i < opponent_meld.length; i++){
        for(var j = 0; j < opponent_meld[i].length; j++){
            var card = document.createElement('div');
            card.classList.add("p2-meld-item")
            card.classList.add(i.toString())
            card.id = "card" + opponent_meld[i][j]
            card_area.appendChild(card)
        }

        var card = document.createElement('div');
        card.classList.add("blank2")
        card_area.appendChild(card)
    }

    // Now that divs exist, set onClick events
    opponent_melds = document.getElementsByClassName("p2-meld-item")
    console.log("Got the melds now, ", opponent_melds)
    set_meld_interactions()

})

