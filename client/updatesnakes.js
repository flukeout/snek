// Updates all of the snakes...
function updateSnakes(snakes){

  for(var i = 0; i < snakes.length; i++){
    var serverSnake = snakes[i];

    for(var j = 0; j < game.snakes.length; j++) {
      var gameSnake = game.snakes[j];
      if(serverSnake.id === gameSnake.id) {
        gameSnake.direction = serverSnake.direction;
        gameSnake.points = serverSnake.points;
        gameSnake.name = serverSnake.name;

        var diff = gameSnake.segments.length - serverSnake.segments.length;
        if(diff > 0){
          // Game snake is longer - need to kill [diff] pieces
          while (diff--) {
            gameSnake.removeSegment(gameSnake.segments[0]);
          }
        } else {
          // Game snake is shorter - need to add a piece
          var tail = gameSnake.segments[0];
          diff = Math.abs(diff);
          while (diff--) {
            gameSnake.makeSegment(tail.x, tail.y, "tail");
          }
        }

        // Then set all the pieces to equal each other
        for(var k = 0; k < gameSnake.segments.length; k++) {
          var serverSegment = serverSnake.segments[k];
          if(serverSegment){
            gameSnake.segments[k].x = serverSegment.x;
            gameSnake.segments[k].y = serverSegment.y;
          }
        }
      }
    }
  }
}
