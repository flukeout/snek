function getSnake(id){
  for(var i = 0; i < game.snakes.length; i++){
    var s = game.snakes[i];
    if(s.id === id) {
      return s;
    }
  }
}
