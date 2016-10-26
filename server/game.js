var uuid = require('./uuid');
var Snake = require('./snake');
var collider = require('./collider');
var getRandom = require('./getrandom');

var Game = function(io,players) {
  this.io = io;
  this.players = players;
};

Game.prototype = {

  // Randomizes the game settings every round
  shuffleSettings : function(){
    this.width = Math.round(getRandom(25,35));      // Game board width, in squares
    this.height = Math.round(getRandom(16,28));     // Game board height, in squares

    this.startLength = Math.round(getRandom(2,8));                        // Starting length of the snake
    this.winLength = Math.round(this.startLength * getRandom(1.5,3.5));   // Snake length needed to win

    this.appleCount = 1;     // Number of apples at any one time
    this.bombLifeSpan = 4;   // How many snake moves Bombs take to go off
    this.bombRadius = 5;     // The effective size of the Bomb Radius

    this.tickDelay =   80;   // Delay, in milliseconds, between each snake movement. Bigger value means game runs slower.
  },


  apples : [],      // Keeps all of the apples
  bombs :  [],      // Keeps all of the bombs
  snakes : [],      // Keeps all of the player snakes
  players : {},     // Keeps all of the payers

  mode : "game",    // Other modes is "winner", which shows the scoreboard

  // Finds a snake by the player's id
  findPlayerSnake: function(playerid) {
    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === playerid) {
        return snake
      }
    }
    return false;
  },


  // Removes a player from the game
  // all this does is remove the player's snake... we can just kill it instead..
  removePlayer : function(id){
    var snake = this.getSnake(id);
    if(snake){
      snake.die("loud",true);
    }
  },

  // Reset game runs when the round is over
  resetGame : function(){

    for(var j = 0; j < this.apples.length; j++) {
      var apple = this.apples[j];
      this.removeApple(apple);
    }

    for (var i=this.snakes.length-1; i>=0; i--) {
      let snake = this.snakes[i];
      snake.die("quiet");
    }

    this.shuffleSettings();

    for(var i = 0; i < this.appleCount; i++) {
      this.addApple();
    }

    // For each player in the game, add a snake
    Object.keys(this.players).forEach(key => {
      var snakeDetails = {
        id : parseInt(key),
        color: this.players[key].color,
        name : this.players[key].name
      }
      this.addSnake(snakeDetails);
    })

    // Let the clients know a new game is starting
    // and send the new game settings.
    this.mode = "game";
    var that = this;
    setTimeout(function(){
      that.io.emit('gameMode', {
        mode : "game",
        gameSettings : {
          width: that.width,
          height: that.height,
          winLength : that.winLength,
        }
      });
    },1000);

  },

  move : function(){
    var winnerIDs = [];
    var futureSnakes = this.getFutureSnakes();

    this.snakes.forEach(s => {
      s.move(futureSnakes);

      if(this.mode == "game") {
        if(s.segments.length >= this.winLength) {
          var id = s.id;
          winnerIDs.push(s.id);
        }
      }
    });

    if(this.mode == "game") {
      if(winnerIDs.length > 0) {
        this.endRound(winnerIDs);
      }

      this.checkBombs();
    }
  },

  // Copy all snakes, move them without collision detection
  // (for use with proper collision-on-next-tick detection)
  getFutureSnakes: function() {
    return this.snakes.map(snake => {
      var s = new Snake(snake, this);
      s.move();
      return s;
    });
  },


  // End the round and send out the scores to the clients
  endRound: function(winnerIDs){

    var winnerID = winnerIDs[0];

    this.players[winnerID].points++;

    // Sends all of the player info to the client
    // to be displayed in the scoreboard

    var sendPlayers = [];

    // Create the array with each player and their point total
    Object.keys(this.players).forEach(key => {
      sendPlayers.push({
        id: key,
        name: this.players[key].name,
        points : this.players[key].points
      })
    })

    // Send that info to the client
    this.io.emit('gameOver', {
      players : sendPlayers,
      winner : winnerIDs[0]
    });

    this.mode = "winner";

    // Explode eveyrone but the winner
    for (var i=this.snakes.length-1; i>=0; i--) {
      let snake = this.snakes[i];
      if(snake.id != winnerID) {
        snake.die("loud",true);
      }
    }

    // 5 seconds later, restart the round
    var that = this;
    setTimeout(function(){
      that.resetGame();
    },5000);
  },


  // This is the bomb countdown
  checkBombs : function(){
    var b = this.bombs, l=b.length;
    for (var i=l-1; i>=0; i--) {
      var bomb = b[i];
      bomb.timeleft--;
      if (bomb.timeleft <= 0) {
        this.explodeBomb(bomb);
      }
    };
  },


  // Returns a snake with a specific id
  getSnake : function(id) {
    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      if(snake.id === id) {
        return snake;
      }
    }
    return false;
  },


  // Adds a new snake to the game
  addSnake : function(data){

    var emptySpot = this.getEmptyCoordinates();

    var snakeDetails = Object.assign({
      x: emptySpot.x,
      y: emptySpot.y,
      name : data.name,
      length: this.startLength
    }, data);

    // If for some reason this snake already exists, don't add it
    if(this.getSnake(data.id)) {
      return;
    }

    // for(var i = 0; i < this.snakes.length; i++) {
    //   var snake = this.snakes[i];
    //   var id = snake.id;
    //   if(id == data.id){
    //     return;
    //   }
    // }

    this.io.emit('spawnSnake', snakeDetails);

    var snake = new Snake(snakeDetails, this);
    snake.init();
    this.snakes.push(snake);

    return snake;
  },

  addApple : function(){
    var emptySpot = this.getEmptyCoordinates();

    var apple = {
      x : emptySpot.x,
      y : emptySpot.y,
      id: uuid()
    };

    this.io.emit('addApple', apple);
    this.apples.push(apple);
  },

  // Retuns random x,y value with no snakes on it
  getEmptyCoordinates: function(){

    var spot = {
      x : getRandom(0,this.width - 1),
      y : getRandom(0,this.height - 1)
    }

    var free = true;

    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      for(var j = 0; j < snake.segments.length; j++){
        var segment = snake.segments[j];
        if(collider(spot,segment)){
          free = false;
          break;
        }
      }
      if(!free){
        break;
      }
    }

    if(free) {
      return spot;
    } else {
      return this.getEmptyCoordinates();
    }
  },

  removeApple: function(apple){
    var appleIndex = this.apples.indexOf(apple);
    this.apples.splice(appleIndex, 1);
    this.io.emit('removeApple', apple.id);
  },

  addBomb : function(x, y, color, snakeid) {
    var bomb = {
      x : parseFloat(x)==x? x : getRandom(0,this.width - 1),
      y : parseFloat(y)==y? y : getRandom(0,this.height - 1),
      id: uuid(),
      snakeid: snakeid,
      timeleft: this.bombLifeSpan,
      color: color
    };
    this.io.emit('addBomb', bomb);
    this.bombs.push(bomb);
  },

  explodeBomb: function(bomb) {
    var x = bomb.x;
    var y = bomb.y;
    var sid = bomb.snakeid;

    var rewardSegments = 0;
    this.snakes.forEach(snake => {
      var segments = this.processSnakeSplosion(snake, x, y);
      if (snake.id !== sid) {
        rewardSegments += segments.length;
      }
    });

    var victor = false;
    this.snakes.forEach(snake => {
      if (snake.id === sid) {
        victor = snake;
      }
    });

    if (rewardSegments > 0 && victor) {
      while(rewardSegments--) {
        var tail = victor.segments[0];
        victor.makeSegment(tail.x, tail.y, "tail");
      }
    }
    this.removeBomb(bomb);
  },

  processSnakeSplosion: function(snake, x, y) {
    var segments = snake.getSegmentsNear(x,y, this.bombRadius);
    // SNAKESPLOSIONS
    if (segments.length > 0) {
      segments.forEach(s => snake.loseSegment(s,true));
    }
    // is snake dead now?
    if (snake.segments.length === 0) {
      snake.die();
    }
    return segments;
  },

  removeBomb: function(bomb) {
    var bombIndex = this.bombs.indexOf(bomb);
    this.bombs.splice(bombIndex, 1);
    this.io.emit('removeBomb', bomb.id);
  },

  checkCollisions(){
    //Checks collisions between apples and snakes
    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      var head = snake.segments[snake.segments.length - 1];

      // apples are segments
      for(var j = 0; j < this.apples.length; j++) {
        var apple = this.apples[j];
        if(collider(apple, head)){
          snake.eat();
          this.removeApple(apple);
          this.addApple();
        }
      }

      // bombs are bad news
      for(var j = this.bombs.length-1; j >= 0; j--) {
        var bomb = this.bombs[j];
        if(collider(bomb, head)) {
          this.removeBomb(bomb);
          this.processSnakeSplosion(snake, bomb.x, bomb.y);
        }
      }
    }
  }
};

module.exports = function(io, players) {

  var game = new Game(io,players);
  game.resetGame();

  var time = new Date().getTime();
  var elapsed = 0;
  var ms = game.tickDelay;

  function move(){
    // console.log(game.snakes.length);

    var now = new Date().getTime();
    var delta = now - time;
    time = now;
    elapsed = elapsed + delta;

    while(elapsed >= ms) {
      elapsed = elapsed - ms;
      game.move();
      io.emit('serverTick', {
        message: elapsed,
        snakes : game.snakes
       });
    }



    setTimeout(move,1);
  }

  move();

  return game;
};
