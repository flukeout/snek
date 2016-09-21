**Left off**

* Trying to make one makeParcile only and passing all the variables into it
* have to put in all the options for the snake particle that i took out, put them into the { options }

**Errors**

* Snakes not respawning at the start of game.resetGame()
* We remove the snakes at the end of the game so there arent any left in the game to spawn...
* We should just make a snake for each player, instead of for each snake or whatever....
  * when we want to respawn...

**Collisions...**

* Each frame, need to create a "future set of snakes" one move ahead
* Then, check the current snakes against the future snakes


1. make a futureSnakes = []
2. move() the futureSnakes - advance each snake in futureSnakes with no regard for any collisions
3. move() the currentSnakes - but check collisions against edges & futureSnakes
