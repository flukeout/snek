var uuid = require('./uuid');
var Snake = require('./snake');
var collider = require('./collider');
var getRandom = require('./getrandom');

var Game = function(io,players) {
  this.io = io;
  this.players = players;
};

Game.prototype = {
  size : 5,         // starting snake size
  winLength : 6,   // How long a snakes needs to bo to win the round

  width : 42,  // Originally 42
  height: 28,
  appleCount : 2,
  apples : [],
  bombs :  [],

  bombLifeSpan: 4,  // how long Bombs take to go off
  bombRadius: 5,    // the size of the Bomb Radius

  snakes : [],      // Array here
  player : {},
  players : {},     // But object here - why? Should we standardize?
  mode : "game",

  findPlayerSnake: function(playerid) {
    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === playerid) {
        return snake
      }
    }
    return false;
  },

  init: function(){
    this.shuffleSettings();
  },

  shuffleSettings : function(){
    console.log("shuffling settings");

    this.width = Math.round(getRandom(25,50));
    this.height = Math.round(getRandom(16,32));
    this.appleCount = Math.round(getRandom(1,3));
    this.size = Math.round(getRandom(2,8));
    this.winLength = Math.round(this.size * getRandom(1.5,3.5));

    // this.bombRadius = Math.round(getRandom(5,7)); // This one is strange... has to be an odd number
  },

  removePlayer : function(id){
    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === id){
        var snakeIndex = this.snakes.indexOf(snake);
        this.snakes.splice(snakeIndex, 1);
      }
    }
  },

  cleanupDebug: function() {
    for (var i=this.snakes.length-1; i>=0; i--) {
      let s = this.snakes[i];
      if (s.debug || s.moveDebugSnake) {
        s.die('debug', true);
      }
    }
  },

  start : function(data){
    // console.log("game start");
    // this.addApple();
    // this.addApple();
  },

  // Reset game runs when the round is over...

  resetGame : function(){

    this.shuffleSettings();

    for (var i=this.snakes.length-1; i>=0; i--) {
      let snake = this.snakes[i];
      snake.die("quiet");
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

    this.cleanupDebug();

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

  cleanupGame : function(){
    // Check each snake, if the associated player doesn't exist in this.players
    // Kill it off without a respawn

    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      var snakeID = snake.id;
      if(!this.players[snakeID]){
        snake.die("", true);
      }
    }
  },

  move : function(){
    var winnerIDs = [];
    var futureSnakes = this.getFutureSnakes();

    this.snakes.forEach(s => {
      if (!s.debug || s.moveDebugSnake) {
        // move this snake, with collisions checked
        // against the hypothetical future in which
        // snakes were allowed to move without any
        // collision detection worked into their move.
        s.move(futureSnakes);
      }

      if(this.mode == "game") {
        if(s.segments.length >= this.winLength) {
          var id = s.id;
          winnerIDs.push(s.id);
        }
      }
    });

    if(this.mode == "game") {
      this.checkWinners(winnerIDs);
      this.checkBombs();
    }
  },

  getFutureSnakes: function() {
    // copy all snakes, move them without collision detection
    // (for use with proper collision-on-next-tick detection)
    return this.snakes.map(snake => {
      var s = new Snake(snake, this);
      s.move();
      return s;
    });
  },

  checkWinners: function(winnerIDs){
    var that = this;
      if(winnerIDs.length > 0){

        for(var i = 0; i < winnerIDs.length; i++){
          var winnerID = winnerIDs[i];
          this.players[winnerID].points++;
        }

        var sendPlayers = [];

        Object.keys(this.players).forEach(key => {
          sendPlayers.push({
            id: key,
            name: this.players[key].name,
            points : this.players[key].points
          })
        })

        this.io.emit('gameOver', {
          players : sendPlayers,
          winner : winnerIDs[0]
        });

        this.mode = "winner";

        // Explode eveyrone but the winner!
        for (var i=this.snakes.length-1; i>=0; i--) {
          let snake = this.snakes[i];
          if(winnerIDs.indexOf(snake.id) < 0) {
            snake.die("loud",true);
          }
        }

        setTimeout(function(){
          that.resetGame();
        },5000);
      }
  },

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

  addSnake : function(data){
    var snakeDetails = Object.assign({
      x: (Math.random() * this.width)  | 0,
      y: (Math.random() * this.height)  | 0,
      name : data.name,
      length: this.size
    }, data);

    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      var id = snake.id;
      if(id == data.id){
        console.log("Already have this snake");
        return;
      } else {
        console.log("Don't have it, making");
      }
    }

    this.io.emit('spawnSnake', snakeDetails);

    var snake = new Snake(snakeDetails, this);
    snake.init();
    this.snakes.push(snake);

    if(this.apples.length == 0) {
      this.addApple();
      this.addApple();
    }

    return snake;
  },

  addApple : function(x, y ){

    // Only adds apples to empty (non-snake) coordinates
    var possible = this.getEmptyCoordinates();
    while(!possible){
      possible = this.getEmptyCoordinates();
    }

    var apple = {
      x : parseFloat(x)==x? x : getRandom(0,this.width - 1),
      y : parseFloat(y)==y? y : getRandom(0,this.height - 1),
      id: uuid()
    };

    this.io.emit('addApple', apple);
    this.apples.push(apple);
  },

  // Retuns random x,y value with nothing on it
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
      return false;
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
  game.init();

  console.log("Width: " + game.width);

  var time = new Date().getTime();
  var elapsed = 0;
  var ms = 80;

  function move(){
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
