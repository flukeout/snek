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
      emitTime = new Date().getTime();
    }
  });
});



var emitTime = 0;
var returnTime = 0;

function calcTime(){
  console.log("Server ping: " + (returnTime - emitTime));
}

function getAverage(array){
  var total = 0;
  for(var i = 0; i < array.length; i++){
    var item = array[i];
    total = total + item;
  }

  return total / array.length;
}


var deltaKeeper = {
  deltas : [],
  trends : [],
  averageTrend : 0,
  average : 0,
  add : function(val){

    this.deltas.push(val);
    if(this.deltas.length > 10) {
      this.deltas.splice(0,1)
    }
    var total = 0;
    for(var i = 0; i < this.deltas.length; i++){
      var delta = this.deltas[i];
      total = total + delta;
    }
    this.average = total / this.deltas.length;

    if(this.deltas.length > 2) {
      var lastTrend = this.deltas[this.deltas.length-1] - this.deltas[this.deltas.length-2];
      this.trends.push(lastTrend);
      this.averageTrend = getAverage(this.trends);
      console.log("averge drift per frame " + this.averageTrend);
    }
  }
}

var lastLocalTick = 0;
var lastServerTick = 0;
var deltas = [];
var blam = 0;

function strobe(type) {
  if(type == "local") {
    $(".local-tick").removeClass("strobe");
    $(".local-tick").width($(".local-tick").width());
    $(".local-tick").addClass("strobe");
    lastLocalTick = new Date().getTime();
  } else {
    $(".server-tick").removeClass("strobe");
    $(".server-tick").width($(".server-tick").width());
    $(".server-tick").addClass("strobe");
    lastServerTick = new Date().getTime();
    // var delta = 250 - Math.abs(250 - (lastServerTick - lastLocalTick));

    var delta = lastServerTick - lastLocalTick;
    $(".delta").text(delta);

    if(delta < 500) {
      deltaKeeper.add(delta);
    }

    blam++
    if(blam > 10) {
      console.log("adjusting tick by " + deltaKeeper.averageTrend);

      game.tickSpeed = game.tickSpeed + (deltaKeeper.averageTrend/2);
      blam = 0;
    }
    // if(deltaKeeper.average > 0) {
    //   game.tickSpeed++;
    // } else {
    //   game.tickSpeed--;
    // }

    // if(delta > 0) {
    //   game.elapsed = game.elapsed + delta/2;
    // }

    // if(delta > 0) {
    //   game.tickSpeed = game.tickSpeed + delta;
    // } else {
    //   game.tickSpeed = game.tickSpeed - delta;
    // }
    // game.elapsed = game.elapsed + delta; // 250 is the worst off

  }
}

////// Pad COD

var socket = io();

var tickHistory = [];
var averageTick = 0;

function calcAverage(){
  var total = 0;
  for(var i = 0; i < tickHistory.length; i++) {
    var tick = tickHistory[i];
    total = total + tick;
  }
  return total / tickHistory.length;
}

socket.on('serverTick', function(msg){
  strobe("server");
  var tick = msg.message;
  tickHistory.push(tick);

  if(tickHistory.length > 15) {
    tickHistory.splice(0,1);
  }

  averageTick = calcAverage();

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

  console.log("received - add apple");
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

socket.on('direction', function(msg){
  var id = parseInt(msg.id);
  var direction = msg.direction;
  var ticks = parseInt(msg.ticks);
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  game.changeDirection(id, direction, ticks, x, y);
  returnTime = new Date().getTime();
  calcTime();
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
  tickSpeed : 500,
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

    if(this.elapsed >= this.tickSpeed) {
      frames++;

      strobe("local");

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

      if(this.segments.length > (this.length + 5) ){
        lastSegment.el.remove();
        this.segments.splice(0,1); // remove last segment
      }

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

          if(i > (this.segments.length - this.length)) {
            seg.el.removeClass("ghost");
          } else {
            seg.el.addClass("ghost");
            seg.el.remove();
          }
          if(this.id == game.playerId) {
            seg.el.addClass("player");
          }
        $(seg.el).css("opacity", 1);
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}


function getRandom(min, max){
  return Math.round(min + Math.random() * (max-min));
}
