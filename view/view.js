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


////// Pad COD

var socket = io();

socket.on('gameSetup', function(msg){
  var width = parseInt(msg.width);
  var height = parseInt(msg.height);
  var id = parseInt(msg.id);
  var apples = msg.apples;
  game.setup(width,height,id, apples);
});

socket.on('addApple', function(msg){
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var id = parseInt(msg.id);

  game.addApple(x,y,id);

  console.log("received - add apple");
});

socket.on('removeApple', function(id){
  game.removeApple(id);
});

socket.on('message', function(msg){
  console.log(msg.content);
});

socket.on('spawnSnake', function(msg){
  console.log(msg);
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

socket.on('direction', function(msg){
  var id = parseInt(msg.id);
  var direction = msg.direction;
  var ticks = parseInt(msg.ticks);
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);

  game.changeDirection(id, direction, ticks, x, y);
});

$(document).ready(function(){
  gameLoop();
});

function gameLoop(){
  game.move();
  window.requestAnimationFrame(gameLoop);
}

var frames = 0;

var game = {
  size : 20,
  width : 40,
  height: 28,
  apples : [],
  snakes : [],
  playerId : 0,
  elapsed : 0,
  time : new Date().getTime(),
  changeDirection : function(id,direction,ticks, x, y){
    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(id === snake.id){
        snake.changeDirection(direction, ticks, x ,y);
      }
    }
  },
  setup : function(width,height,id,apples) {

    for(var i = 0; i < apples.length; i++) {
      var apple = apples[i];
      this.addApple(apple.x,apple.y,apple.id);
    }

    this.height = height;
    this.width = width;
    this.playerId = id;
    this.start();

    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);

  },
  start : function(){
  },
  move : function(){
    var now = new Date().getTime();
    var delta = now - this.time;
    this.time = now;
    this.elapsed = this.elapsed + delta;

    if(this.elapsed >= 80) {
      frames++;
      for(var i = 0 ; i < this.snakes.length; i++ ){
        var s = this.snakes[i];
        s.move();
      }
      this.elapsed = 0;

    }
  },
  killSnake : function(id){
    for(var i = 0; i < this.snakes.length; i++){
      var snake = this.snakes[i];
      if(snake.id === id) {
        snake.die();
        // console.log("Client: snake died at move " + frames);
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
    console.log("removing apple" + id);
    console.log(this.apples);
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
    ticks : 0,
    color : color,
    speed : 5, // every 10 frames?
    direction : direction,
    segments : [],
    changes : [],
    rewind : function(){
      var head = this.segments[this.segments.length - 1];

      head.el.remove();
      this.segments.splice(this.segments.length - 1,1);

      var head = this.segments[this.segments.length - 1];
      this.x = head.x;
      this.y = head.y;
      this.ticks--;
    },
    changeDirection : function(direction,ticks,x,y){

      // console.log("Server : " + ticks);
      // console.log("Client : " + this.ticks);
      //
      if(this.ticks < ticks) {
        this.move();
      }

      if(this.ticks > ticks) {
        this.rewind();
      }

      console.log("Server: snake changed dir at: " + x + "," + y + " at " + ticks);
      console.log("Client: snake changed dir at: " + this.x + "," + this.y + " at " + this.ticks);

      // if(x != this.x || y != this.y){
      //
      // }

      if((this.direction == "up" && direction == "down") || (this.direction == "down" && direction == "up")) {
        return;
      }
      if((this.direction == "left" && direction == "right") || (this.direction == "right" && direction == "left")) {
        return;
      }
      this.direction = direction;
    },
    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
    },
    makeSegment : function(x,y,place){

      var segmentEl = $("<div class='snek'><div class='body'></div></div>");

      var segmentDetails = {
        x : x,
        y : y,
        el : segmentEl
      }

      $(".board").append(segmentEl);

      if(!this.moving) {
        segmentEl.hide();
      }

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
      this.moving = true;
      this.ticks++;

      var head = this.segments[this.segments.length - 1];

      var newHead = {
        x : head.x,
        y : head.y
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

      this.makeSegment(newHead.x,newHead.y,"head");

      var lastSegment = this.segments[0];

      // lastSegment.el.remove();
      // this.segments.splice(0,1); // remove last segment

      this.draw();
    },
    die : function(){

      for(var i = 0; i < this.segments.length; i++) {
        var tail = this.segments[i];
        tail.el.addClass("gone");
        setTimeout(function(tail) {
          return function(){
            tail.el.remove();
          };
        }(tail), 200);
      }

      var snakeIndex = game.snakes.indexOf(this);

      game.snakes.splice(snakeIndex, 1);

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

          seg.el.addClass("ghost");
          if(i > (this.segments.length - this.length)) {
          seg.el.removeClass("ghost");
          }

        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}


function getRandom(min, max){
  return Math.round(min + Math.random() * (max-min));
}
