Collisions...

* Each frame, need to create a "future set of snakes" one move ahead
* Then, check the current snakes against the future snakes


1. make a futureSnakes = []
2. move() the futureSnakes - advance each snake in futureSnakes with no regard for any collisions
3. move() the currentSnakes - but check collisions against edges & futureSnakes
