var socket = io();

socket.on('newChat', function(msg){
  var snake = getSnake(msg.id);
  if(snake){
    snake.say(msg.message);
  }
});

socket.on('gameOver', function(msg) {
  var players = msg.players;
  var winner = msg.winner;
  game.gameWon(players,winner);
});

socket.on('gameMode', function(msg) {
  var mode = msg.mode;
  var settings = msg.gameSettings;
  game.setupBoard(settings.width, settings.height, settings.winLength);
  game.changeMode(mode);
});

socket.on('serverTick', function(msg){
  var snakes = msg.snakes;
  updateSnakes(snakes);
  game.move();
});

socket.on('warpSnake', function(msg){
  var snake = getSnake(msg.id);
  snake.loadWarp(msg.segments);
});

socket.on('loseHead', function(msg){
  var snake = getSnake(msg.id);
  snake.loseHead();
});

socket.on('loseSegment', function(msg) {
  var snake = getSnake(msg.id);
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var showParticle = msg.showParticle;
  snake.loseSegment(x, y, showParticle);
});

socket.on('gameSetup', function(msg){
  var width = parseInt(msg.width);    // board width
  var height = parseInt(msg.height);  // board height
  var id = parseInt(msg.id);          // player id
  var apples = msg.apples;            // apples already in play
  var snakes = msg.snakes;            // snakes already in play
  var winLength = msg.winLength;      // snake length needed to win
  game.setup(width, height, id, apples, snakes, winLength);
});

socket.on('snakeEat', function(msg){
  var id = msg;
  var snake = getSnake(id);
  snake.eat();
});

socket.on('addApple', function(msg){
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var id = parseInt(msg.id);
  game.addApple(x,y,id);
});

socket.on('removeApple', function(id){
  game.removeApple(id);
});

socket.on('addBomb', function(msg){
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var id = parseInt(msg.id);
  var color = msg.color;
  game.addBomb(x,y,id,color);
});

socket.on('removeBomb', function(id){
  game.removeBomb(id);
});

socket.on('message', function(msg){
  console.log(msg.content);
});

socket.on('spawnSnake', function(msg){
  var id = parseInt(msg.id);
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var color = msg.color;
  var direction = msg.direction;
  var length = msg.length;
  var name = msg.name || "no_name"
  game.addSnake(id, x, y, color, direction, length, name);
});


// When another player disconnects...
socket.on('playerDisconnect', function(msg){
  game.removePlayer(msg.id);
});

// killSnake - where does this come from
socket.on('killSnake', function(msg){
  var id = msg.id;
  var x = msg.x;
  var y = msg.y;
  var type = msg.type;
  var snake = getSnake(msg.id);
  if(snake){
    snake.die(x,y,type);
  }
});
