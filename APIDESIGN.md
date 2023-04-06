| Action | Inputs/Data | Pre Conditions | Post Conditions | API Endpoint |
|---------------|---------------|---------------|---------------|---------------|
| User creates game | | | | |
| User ends game | | | | |
| User wins game | | | | |
| User loses game | | | | |
| User organizes hand | | | | |
| User draws card from deck | 1. player_id<br />2. game_id | 1. player_id is a player in game_id <br />2.It is player_id's turn<br />3. player_id has not drawn a card this turn | 1. Deck removes last card_id<br />2. Add card_id to player_id's  hand<br />3. Update number of cards in player_id's hand | POST /games/:id/draw_check <br /> (game_id is provided in URL, player_id available in session)|
| User takes top card on discard pile | | | | |
| User melds three of a kind | | | | |
| User melds three of a run | | | | |
| User knocks | | | | |


<br />