var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var colors = require('../view/colors');
var nextColor = (function() {
  var c = 0;
  return function() {
    return colors[c++ % colors.length];
  };
}());

var uuid = (function() {
  var uid = 0;
  return function() {
    return ++uid;
  };
}());

var players = {};

app.use(express.static(path.join(__dirname,'..','view')));
app.use("/pad", express.static(path.join(__dirname,'..','pad')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});

// A player joins the game
io.on('connection', function(socket) {

  var player = {
    id: uuid(),
    socket: socket,
    color: nextColor()
  };

  players[player.id] = player;

  // welcome user, send them their snake color (may be user-changeble later)
  console.log('a user connected, giving it snake id', player.id);

  // send in response to connecting:
  socket.emit('gameSetup', {
    width: game.width,
    height: game.height,
    id: player.id,
    color: player.color,
    apples: game.apples,
    snakes: game.snakes
  });

  // inform everyone a new player joined
  io.emit('playerJoin', {
    id: player.id,
    color: player.color
  });

  // a client disconnects - we don't do much with that yet

  socket.on('disconnect', function(){
    io.emit('playerDisconnect', {
      id: player.id
    })
    game.removePlayer(player.id);
  });

  // client requests a new snake, server spawns a new snake
  socket.on('makeSnake', function() {
    // console.log("making a snake for player with id", player.id);
  	var data = {
      id: player.id,
      color: player.color
    };
    game.addSnake(data);
  });

  // client sends direction input to server, server broadcasts the player's move
  socket.on('direction', function(data){
    data = {
      id: player.id,
      direction: data.direction
    }
    game.changeDirection(data);
  });

  // client snake died... broadcast to all connected clients
  socket.on('died', function() {
    io.emit('killSnake', {
      id: player.id
    });
  });
});


// boring old server
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});

var game = {
  size : 12,
  width : 40,
  height: 26,
  apples : [],
  snakes : [],
  player : {},
  removePlayer : function(id){
    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === id){
        var snakeIndex = this.snakes.indexOf(snake);
        this.snakes.splice(snakeIndex, 1);
      }
    }
  },
  changeDirection : function(data){

    var newDirection = data.direction;
    var id = data.id;

    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === id){
        snake.changeDirection(data.direction);
        data.x = snake.x;
        data.y = snake.y;
        data.ticks = snake.ticks;
        io.emit('direction', data);
      }
    }
  },
  start : function(data){
    this.addApple();
  },
  move : function(){
    for(var i = 0 ; i < this.snakes.length; i++ ){
      var s = this.snakes[i];
      s.move();
    }
  },
  addSnake : function(data){
    var snakeDetails = {
      id : data.id,
      x: (Math.random() * game.width)  | 0,
      y: (Math.random() * game.height)  | 0,
      color: data.color,
      length: this.size,
    }

    io.emit('spawnSnake', snakeDetails);

    var snake = makeSnake(snakeDetails);

    snake.init();
    this.snakes.push(snake);
    if(this.apples.length == 0) {
      this.addApple();
    }
  },
  addApple : function(){
    var apple = {
      x : getRandom(0,this.width - 1),
      y : getRandom(0,this.height - 1),
      id: uuid()
    };

    io.emit('addApple', apple);
    this.apples.push(apple);
  },
  removeApple: function(apple){
    var appleIndex = this.apples.indexOf(apple);
    this.apples.splice(appleIndex, 1);
    io.emit('removeApple', apple.id);

  },
  checkCollisions(){
    //Checks collisions between apples and snakes
    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      var head = snake.segments[snake.segments.length - 1];

      for(var j = 0; j < this.apples.length; j++) {
        var apple = this.apples[j];
          if(collider(apple, head)){
            snake.eat();
            this.removeApple(apple);
            this.addApple();
          }
        }
      }
    }
}

function collider(one,two){
  if(one.x == two.x && one.y == two.y ) {
    return true;
  }
}

function makeSnake(details){

  var id = details.id;
  var x = details.x;
  var y = details.y;
  var length = details.length;
  var color = details.color;

  // console.log("making snake", id, x, y, length, color);

  var snek = {
    x : x,
    y : y,
    id : id,
    size : 4,
    length: length,
    moving : false,
    ticks : 0,
    moves : 0,
    color : color,
    speed : 5, // every 10 frames?
    direction : undefined,
    segments : [],
    changeDirection : function(direction){

      if((this.direction == "up" && direction == "down") || (this.direction == "down" && direction == "up")) {
        return;
      }
      if((this.direction == "left" && direction == "right") || (this.direction == "right" && direction == "left")) {
        return;
      }
      this.direction = direction;
    },
    init : function(){
      // this.direction = directions[getRandom(0,directions.length-1)];
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
    },
    makeSegment : function(x,y,place){

      // var segmentEl = $("<div class='snek'><div class='body'></div></div>");
      var segmentDetails = {
        x : x,
        y : y,
      }

      if(place == "tail") {
        this.segments.splice(0, 0, segmentDetails);
      } else {
        this.segments.push(segmentDetails);
      }

    },
    eat : function(){
      this.length++;
      var tail = this.segments[0];
      this.makeSegment(tail.x,tail.y,"tail");
      io.emit('snakeEat', this.id);
    },
    move : function(){
      this.ticks++;
      this.moves++;
      this.moving = true;

      var blocked = false;

      var head = this.segments[this.segments.length - 1];

      if(head.x >= game.width - 1 && this.direction == "right"){
        blocked = true;
      } else if (head.x >= game.width - 1 && this.direction == "right"){
        blocked = true;
      } else if (head.y >= game.height - 1 && this.direction == "down"){
        blocked = true;
      } else if(head.x <= 0 && this.direction == "left"){
        blocked = true;
      } else if (head.y <= 0 && this.direction == "up"){
        blocked = true;
      }

      if(blocked){
        this.die();
        return;
      }

      // From here on in, we are moving...
      game.checkCollisions();

      var newHead = {
        x : parseInt(head.x),
        y : parseInt(head.y)
      }

      switch(this.direction) {
        case "up":
          newHead.y--;
          break;
        case "down":
          newHead.y++;
          break;
        case "right":
          newHead.x++;
          break;
        case "left":
          newHead.x--;
          break;
      }

      this.x = newHead.x;
      this.y = newHead.y;

      // check against other snakes
      var collide = false;

      // check if it crashed into itself
      if(this.moves > this.length) {
        for(var i = 0; i < this.segments.length; i++) {
          var segment = this.segments[i];
          collide = collider(newHead,segment);
          if(collide){
            break;
          }
        }
      }

      // Other snakes...

      for(var i = 0; i < game.snakes.length; i++) {
        var otherSnake = game.snakes[i];

        if(otherSnake != this) {
          for(var j = 0; j < otherSnake.segments.length; j++) {
            var seg = otherSnake.segments[j];
            collide = collider(newHead,seg);
            if(collide){
              break;
            }
          }
        }

        if(collide){
          break;
        }
      }

      if(collide) {
        this.die();
        return;
      }

      this.makeSegment(newHead.x,newHead.y,"head");

      var lastSegment = this.segments[0];
      this.segments.splice(0,1);
    },
    loseHead : function(){
      if(this.segments.length > 1) {
        io.emit('loseHead', {id: this.id,});
        this.segments.splice(this.segments.length - 1, 1);
      }
    },
    die : function(){
      this.loseHead();

      return;

      console.log("snake id " + this.id + " died at " + this.moves);

      io.emit('killSnake', { id: this.id });

      for(var i = 0; i < this.segments.length; i++) {
        var tail = this.segments[i];
      }

      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);

      //respawns snake...

      var snakeDetails = {
        id : this.id,
        color: this.color
      }

      game.addSnake(snakeDetails);

    },
    loseTail : function(){
      if(this.segments.length > 1) {
        var tail = this.segments[0];
        this.segments.splice(0,1);
      }
    }
  }
  return snek;
}

var totalFrames = 0;
var avgFrame = 0;

var time = new Date().getTime();

var elapsedHistory = [];

function getRandom(min, max){
  return Math.round(min + Math.random() * (max-min));
}
var elapsed = 0;
var ms = 80;

function move(){
  var now = new Date().getTime();
  var delta = now - time;
  time = now;
  elapsed = elapsed + delta;

  while(elapsed >= ms) {
    io.emit('serverTick', {
      message: elapsed,
      snakes : game.snakes
     });
    elapsed = elapsed - ms;
    totalFrames++;
    game.move();
  }

  setTimeout(move,1);
}

move();