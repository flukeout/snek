var socket = io();

$(document).ready(function(){
  socket.emit("makeSnake");

  $(document).on("keydown",function(e){

    var direction;
    switch(e.keyCode) {
      case 37:
        direction = "left";
        break;
      case 39:
        direction = "right";
        break;
      case 38:
        direction = "up";
        break;
      case 40:
        direction = "down";
        break;
      default:
        direction = false;
    }

    if(direction){
      socket.emit('direction', {
        direction: direction
      });
    }
  });
});


function updateSnakes(snakes){
  for(var i = 0; i < snakes.length; i++){
    var snake = snakes[i];

    for(var j = 0; j < game.snakes.length; j++) {
      var gameSnake = game.snakes[j];
      if(snake.id === gameSnake.id) {
        for(var k = 0; k < gameSnake.segments.length; k++) {
          var serverSegment = snake.segments[k];
          if(serverSegment){
            gameSnake.segments[k].x = serverSegment.x;
            gameSnake.segments[k].y = serverSegment.y;
          }
        }
      }
    }
  }
}

socket.on('serverTick', function(msg){
  var snakes = msg.snakes;
  updateSnakes(snakes);
  game.move();
});

socket.on('loseHead', function(msg){
  console.log("loseHead",msg);

  var snake = getSnake(msg.id);
  snake.loseHead();
  // var snakes = msg.snakes;
  // updateSnakes(snakes);
  // game.move();
});

socket.on('gameSetup', function(msg){
  var width = parseInt(msg.width);
  var height = parseInt(msg.height);
  var id = parseInt(msg.id);
  var apples = msg.apples;
  var snakes = msg.snakes;
  game.setup(width,height,id, apples, snakes);
});

socket.on('playerDisconnect', function(msg){
  game.removePlayer(msg.id);
});

socket.on('snakeEat', function(msg){
  var id = msg;
  var snake = getSnake(id);
  snake.eat();
});

function getSnake(id){
  for(var i = 0; i < game.snakes.length; i++){
    var s = game.snakes[i];
    if(s.id === id) {
      return s;
    }
  }
}

socket.on('addApple', function(msg){
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var id = parseInt(msg.id);
  game.addApple(x,y,id);
});

socket.on('removeApple', function(id){
  game.removeApple(id);
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

  game.addSnake(id, x, y, color, direction,length);
});

socket.on('killSnake', function(msg){
  var id = msg.id;
  game.killSnake(id);
});



var game = {
  size : 20,
  width : 40,
  height: 28,
  apples : [],
  tickSpeed : 200,  // 8 frames difference
  tickSpeedModifier : 0,
  snakes : [],
  playerId : 0,
  elapsed : 0,
  time : new Date().getTime(),
  removePlayer : function(id){
    for(var i = 0 ; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id === id){
        snake.die();
      }
    }
  },
  changeDirection : function(id,direction,ticks, x, y){
    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(id === snake.id){
        snake.changeDirection(direction, ticks, x ,y);
      }
    }
  },
  setup : function(width,height,id,apples,snakes) {

    for(var i = 0; i < apples.length; i++) {
      var apple = apples[i];
      this.addApple(apple.x,apple.y,apple.id);
    }

    // Adds snakes from the server...
    for(var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      this.addSnake(snake.id,snake.x, snake.y, snake.color, "", snake.length);
    }

    this.height = height;
    this.width = width;
    this.playerId = id;
    // this.start();

    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);
  },
  move : function(){
      for(var i = 0 ; i < this.snakes.length; i++ ){
        var s = this.snakes[i];
        s.move();
      }
  },
  killSnake : function(id){
    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      if(snake.id === id) {
        snake.die();
      }
    }
  },
  addSnake : function(id, x, y, color, direction, length){
    var snake = makeSnake(id, x, y, color, direction, length);
    snake.init();
    this.snakes.push(snake);
  },
  addApple : function(x,y,id){

    var apple = {
      el : $("<div class='apple'><div class='body'></div></div>"),
      x : x,
      y : y,
      id : id
    }

    $(".board").append(apple.el);

    apple.el.css("width",this.size).css("height",this.size);
    apple.el.css("transform","translateX(" + this.size * apple.x + "px) translateY("+this.size * apple.y+"px)");
    this.apples.push(apple);
  },
  removeApple: function(id){
    for(var i = 0; i < this.apples.length; i++){
      var apple = this.apples[i];
      if(id === apple.id){
        apple.el.remove();
        var appleIndex = this.apples.indexOf(apple);
        this.apples.splice(appleIndex, 1);
      }
    }
  }
}

function makeSnake(id, x, y, color, direction, length){
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
    length: length,
    moving : false,
    color : color,
    speed : 5, // every 10 frames?
    segments : [],
    changes : [],
    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
    },
    makeSegment : function(x,y,place){

      console.log("Adding snake segment",this.segments.length);

      var segmentEl = $("<div class='snek'><div class='body'></div></div>");

      var segmentDetails = {
        x : x,
        y : y,
        el : segmentEl
      }

      $(".board").append(segmentEl);
      segmentEl.css("opacity",0);

      segmentEl.css("width",this.size).css("height",this.size);
      segmentEl.find(".body").css("background",this.color);

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
      this.draw();
    },
    die : function(){
      $(".board").removeClass("crash").width($(".board").width());
      $(".board").addClass("crash");
      for(var i = 0; i < this.segments.length; i++) {
        var tail = this.segments[i];
        tail.el.addClass("gone");
        setTimeout(function(tail) {
          return function(){
            tail.el.remove();
          };
        }(tail), 1000);
      }
      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);
    },
    loseHead : function(){
      if(this.segments.length > 1) {
        var head = this.segments[this.segments.length - 1];
        head.el.addClass("gone");
        setTimeout(function(el) {
          return function(){
            el.remove();
          };
        }(head.el), 200);
        this.segments.splice(this.segments.length - 1,1);
      }
    },
    loseTail : function(){
      if(this.segments.length > 1) {
        var tail = this.segments[0];
        tail.el.addClass("gone");
        setTimeout(function(el) {
          return function(){
            el.remove();
          };
        }(tail.el), 200);
        this.segments.splice(0,1);
      }
    },
    draw : function(){
      for(var i = 0; i < this.segments.length; i++) {
        var seg = this.segments[i];
        $(seg.el).css("opacity", 1);
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}
