function getSnake(id){
  for(var i = 0; i < game.snakes.length; i++){
    var snake = game.snakes[i];
    if(snake.id === id) {
      return snake;
    }
  }
}
