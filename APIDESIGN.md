| Action | Inputs/Data | Pre Conditions | Post Conditions | API Endpoint |
|---------------|---------------|---------------|---------------|---------------|
| User creates game |None  |The player is logged in. | A new game session is created and the game state is initialized.| |
| User ends game |None |The player is currently in a game session. | The game session is ended and the player is returned to the lobby. | |
| User wins game | None |The game is in progress and the player wins the game. |The player's win count is incremented, and the game ends. | |
| User loses game |None |  The game is in progress and the player loses the game.|The player's loss count is incremented, and the game ends. | |
| User organizes hand |The player's preferred sorting method (suit or rank). |The player has cards in their hand. |The player's hand is sorted by the selected method. | |
| User draws card from deck | 1. player_id<br />2. game_id | 1. player_id is a player in game_id <br />2.It is player_id's turn<br />3. player_id has not drawn a card this turn | 1. Deck removes last card_id<br />2. Add card_id to player_id's  hand<br />3. Update number of cards in player_id's hand | POST /games/:id/draw_check <br /> (game_id is provided in URL, player_id available in session)|
| User takes top card on discard pile |None or a flag indicating whether to draw from the deck or the discard pile. |The deck is not empty or the discard pile has at least one card. |The player's hand is updated with the new card. | |
| User melds three of a kind | three cards to be melded. |player has at least three cards of the same rank in their hand. |three cards are melded, and the player's melds are updated | |
| User melds three of a run |the cards to be melded |player has at least three cards of consecutive ranks in the same suit in their hand |cards are melded, and the player's melds are updated | |
| User knocks | None |The player has a hand that can not form melds that total 10 or fewer points (after adding the value of deadwood cards, which are unmelded cards), and the opponent has not yet knocked during the round.|The round ends, and the player's hand is compared to the opponent's hand to determine the winner of the round. | |


<br />
