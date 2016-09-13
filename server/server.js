var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var colors = require('../client/colors');
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

app.use(express.static(path.join(__dirname,'..','client')));
app.use("/view", express.static(path.join(__dirname,'..','view')));
app.use("/pad", express.static(path.join(__dirname,'..','pad')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});

console.error('bar');

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
    color: player.color
  });

  // inform everyone a new player joined
  io.emit('playerJoin', {
    id: player.id,
    color: player.color
  });

  // a client disconnects - we don't do much with that yet
  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('playerDisconnect', {
      id: player.id
    })
  });

  // client requests a new snake, server spawns a new snake
  socket.on('makeSnake', function() {
    console.log("making a snake for player with id", player.id);
  	var data = {
      id: player.id,
      x: (Math.random() * game.width)  | 0,
      y: (Math.random() * game.height)  | 0,
      length: 10,
      color: player.color
    };
  	console.log("new snake request", JSON.stringify(data));
    io.emit('spawnSnake', data);
    game.addSnake(data);

  });

  // client sends direction input to server, server broadcasts the player's move
  socket.on('direction', function(data){
    data = {
      id: player.id,
      direction: data.direction
    }

    game.changeDirection(data);

    console.log("directional change: ", JSON.stringify(data));;
    io.emit('direction', data);
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
  size : 20,
  width : 20,
  height: 28,
  apples : [],
  snakes : [],
  player : {},
  ticks: 0,
  changeDirection : function(data){
    var newDirection = data.direction;
    var id = data.id;

    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === id){
        snake.changeDirection(data.direction);
      }
    }
  },
  start : function(data){
    player = {
      color: data.color,
      id: parseInt(data.id)
    }

    this.width = parseInt(data.width);
    this.height = parseInt(data.height);

    this.addApple();
    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);
  },
  move : function(){

    for(var i = 0 ; i < this.snakes.length; i++ ){
      var s = this.snakes[i];
      s.move();
    }
  },
  addSnake : function(snakeData){

    console.log("adding a snake");
    var snake = makeSnake(
      parseInt(snakeData.id),
      parseInt(snakeData.x),
      parseInt(snakeData.y),
      parseInt(snakeData.length),
      snakeData.color
    );
    snake.init();
    this.snakes.push(snake);

  },
  addApple : function(){
    var apple = {
      el : $("<div class='apple'><div class='body'></div></div>"),
      x : getRandom(0,this.width - 1),
      y : getRandom(0,this.height - 1)
    }

    $(".board").append(apple.el);
    apple.el.css("width",this.size).css("height",this.size);
    apple.el.css("transform","translateX(" + this.size * apple.x + "px) translateY("+this.size * apple.y+"px)");
    this.apples.push(apple);
  },
  removeApple: function(apple){
    apple.el.remove();
    var appleIndex = this.apples.indexOf(apple);
    this.apples.splice(appleIndex, 1);
  },
  checkCollisions(){
    //Checks collisions between apples and snakes
    // for(var i = 0; i < this.snakes.length; i++){
    //   var snake = this.snakes[i];
    //   var head = snake.segments[snake.segments.length - 1];
    //
    //   for(var j = 0; j < this.apples.length; j++) {
    //     var apple = this.apples[j];
    //       if(collider(apple, head)){
    //         snake.eat();
    //         this.removeApple(apple);
    //         this.addApple();
    //       }
    //     }
    //   }
    }
}

function collider(one,two){
  if(one.x == two.x && one.y == two.y ) {
    return true;
  }
}

function makeSnake(id, x, y, length, color){
  console.log("making snake", id, x, y, length, color);
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
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
    },
    move : function(){


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

      // console.log(blocked);
      // From here on in, we are moving...
      // game.checkCollisions();

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

      // for(var i = 0; i < game.snakes.length; i++) {
      //   var otherSnake = game.snakes[i];
      //
      //   for(var j = 0; j < otherSnake.segments.length; j++) {
      //     var seg = otherSnake.segments[j];
      //     collide = collider(newHead,seg);
      //     if(collide){
      //       break;
      //     }
      //   }
      //   if(collide){
      //     break;
      //   }
      // }


      if(collide) {
        this.die();
        // this.loseTail();
        return;
      }

      this.makeSegment(newHead.x,newHead.y,"head");

      var lastSegment = this.segments[0];
      this.segments.splice(0,1);
    },
    die : function(){
      console.log("snake died at " + this.moves);

      io.emit('killSnake', { id: this.id });

      for(var i = 0; i < this.segments.length; i++) {
        var tail = this.segments[i];
      }

      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);

      // request a new snake, now that we're dead...
      // socket.emit("makeSnake");
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

function getAverageFrameMS(){
  var total = 0;
  for(var i = 0; i < elapsedHistory.length; i++) {
    var frameTime = elapsedHistory[i];
    total = total + frameTime;
  }

  var avg = total / elapsedHistory.length;
  return avg;

}

function move(){

  totalFrames++;
  var now = new Date().getTime();
  var delta = now - time;
  time = now;

  elapsedHistory.push(delta);

  if(elapsedHistory.length > 10) {
    elapsedHistory.splice(0,1);
  }

  var average = getAverageFrameMS();

  var delta = 80 - average;

  game.move();
  setTimeout(function(){
    move();
  },80 + delta);
}

move();