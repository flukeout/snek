**Thoughts & Fixes**

* Find a way to getSnake using the same function / javascript file
  * Same with getRandom.. (used in particles JS)

* add wall crash juice
* need to keep the mobile pad client from being 'zoomable' when tapping the screen

* One problem is that when we try to do the scores
* We look for snakes that are alive to see what color they are
* But sometimes they're dead becuase they got bombed, so we can't get the colors
* Should keep track of game snakes differently I think
  * Maybe always have them in the game.snakes
  * But have a dead / alive flag on them


* Clean up game.setup + game.setupBoard
* They should be in charge of different things
  * One for stuff like snakes and apples
  * One for visual properties (widht, height, winlength) etc.
