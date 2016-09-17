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
app.use("/sounds", express.static(path.join(__dirname,'..','sounds')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});


// A player sends a message
// io.emit('chatMessage', {
//   message: message
// });

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

  socket.on('sendChat',function(data){
    console.log("Chat message from" + player.id);

    io.emit('newChat',{
      id: player.id,
      message: data.message
    });
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

    for(var i = 0 ; i < game.snakes.length; i++) {
      var snake = game.snakes[i];
      if(snake.id === data.id){
        // snake.changeDirection(data.direction);
        snake.pushDirection(data.direction);
      }
    }
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
  size : 5,    // starting snake size
  width : 42,   // board width
  height: 28,   // board height
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
  start : function(data){
    this.addApple();
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
  } else {
    return false;
  }
}

function makeSnake(details){

  var id = details.id;
  var x = details.x;
  var y = details.y;
  var length = details.length;
  var color = details.color;

  var snek = {
    x : x,
    y : y,
    id : id,
    size : 4,
    length: length,
    moved : false,
    ticks : 0,
    color : color,
    direction : undefined,
    segments : [],
    nextDirection : "",
    directionQ : [],
    pushDirection: function(direction){
      this.directionQ.push(direction);
    },
    changeDirection : function(newDirection){

      if(this.segments.length == 1) {
        this.nextDirection = newDirection;
        return;
      }

      if((this.direction == "up" && newDirection == "down") || (this.direction == "down" && newDirection == "up")) {
        return;
      }

      if((this.direction == "left" && newDirection == "right") || (this.direction == "right" && newDirection == "left")) {
        return;
      }

      this.nextDirection = newDirection;
    },
    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
    },
    makeSegment : function(x,y,place){
      var newSegment = {
        x : x,
        y : y,
      }

      if(place == "tail") {
        this.segments.splice(0, 0, newSegment);
      } else {
        this.segments.push(newSegment);
      }
    },
    eat : function(){
      this.length++;
      var tail = this.segments[0];
      this.makeSegment(tail.x,tail.y,"tail");
      io.emit('snakeEat', this.id);
    },
    move : function(){

      if(this.directionQ.length > 0) {
        var nextDirection = this.directionQ[0];
        this.changeDirection(nextDirection);
        this.directionQ.splice(0, 1);
        this.direction = this.nextDirection;
        this.moving = true;
      }

      var collide = false;

      var head = this.segments[this.segments.length - 1];

      if(head.x >= game.width - 1 && this.direction == "right"){
        collide = true;
      } else if (head.y >= game.height - 1 && this.direction == "down"){
        collide = true;
      } else if(head.x <= 0 && this.direction == "left"){
        collide = true;
      } else if (head.y <= 0 && this.direction == "up"){
        collide = true;
      }

      // Check collisions with apples..
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

      // Check if it has collided with itself
      // But only if it hasn't collided with a wall / edge

      if(this.moving && !collide) {
        for(var i = 0; i < this.segments.length; i++) {
          var segment = this.segments[i];
          var check = collider(newHead,segment);
          if(!collide && check) {
            collide = check;
            break;
          }
        }
      }

      // If it hasn't yet collided with itself...
      // Check collisions with other snakes
      if(!collide) {
        for(var i = 0; i < game.snakes.length; i++) {
          var otherSnake = game.snakes[i];
          if(otherSnake != this) {
            for(var j = 0; j < otherSnake.segments.length; j++) {
              var segment = otherSnake.segments[j];
              var check = collider(newHead,segment);
              if(!collide && check) {
                collide = check;
                break;
              }
            }
          }
        }
      }

      if(collide) {
        io.emit('loseHead', {id: this.id,});
        if(this.segments.length > 1) {
          this.segments.splice(0,1);
        } else {
          this.die();
        }
      } else {
        this.makeSegment(newHead.x,newHead.y,"head");
        this.segments.splice(0,1);
      }
    },
    loseHead : function(){
      if(this.segments.length > 1) {
        io.emit('loseHead', {id: this.id,});
        this.segments.splice(this.segments.length - 1, 1);
      }
    },
    getHead : function(){
      return this.segments[this.segments.length - 1];
    },
    die : function(){

      var head = this.getHead();

      io.emit('killSnake', {
        id: this.id,
        x: head.x,
        y: head.y
      });

      for(var i = 0; i < this.segments.length; i++) {
        var tail = this.segments[i];
      }

      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);

      var snakeDetails = {
        id : this.id,
        color: this.color
      }

      game.addSnake(snakeDetails);

    },
    loseTail : function(){
      if(this.segments.length > 1) {
        io.emit('loseTail', {id: this.id,});
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
