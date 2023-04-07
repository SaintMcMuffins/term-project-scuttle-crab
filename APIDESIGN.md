Game ID is provided in URLs, and player ID is included in session
| Action | Inputs/Data | Pre Conditions | Post Conditions | API Endpoint |
|---------------|---------------|---------------|---------------|---------------|
| User creates game |Player who is creating game |The player is logged in. | A new game session is created and the game state is initialized.|POST /games/:id/create_game |
| User ends game |Player |The player is currently in a game session. | The game session is ended and the player is returned to the lobby. | POST /games/:id/end_game |
| User organizes hand |The player, the player's preferred sorting method (suit or rank). |The player has cards in their hand. |The player's hand is sorted by the selected method. | POST /games/:id/sort {method} |
| User draws card from deck | Player | Player is in the game, it is the player's turn, player has not drawn a card this turn | Deck removes last card, card is added to player's hand, update number of cards in player_id's hand | POST /games/:id/draw_deck |
| User takes top card on discard pile | Player who is drawing | The player is in the game, it is the player's turn, the player has not drawn a card this turn |The player's hand is updated with the new card. | POST /games/:id/draw_discard |
| User discards a card | Player who is discarding, card to discard | Player is in the game, it is the player's turn, player has drawn a card this turn | Player's hand is updated for each user, card is added to discard pile | POST /games/:id/discard {card}|
| User melds | Player, cards to be melded. | Player selects at least three cards, the selected cards form a legal meld | Cards are melded, and the player's melds are updated | POST /games/:id/meld {cards} |
| User ends turn | Player | Player is in game, it is the player's turn, the player has discarded a card | Player's turn end, other player becomes active player | POST /games/:id/end_turn |
| User knocks | Player who knocked |The player has a hand that can not form melds that total 10 or fewer points (after adding the value of deadwood cards, which are unmelded cards), it is the player's turn, the player has drawn in this turn, and the player has not discarded in this turn |The round ends, and the player's hand is compared to the opponent's hand to determine the winner of the round. | POST \games\:id\knock <br /> {melds}|


<br />
