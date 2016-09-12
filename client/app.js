var socket = io();

var directions = ["left","right","up","down"];

$(document).ready(function(){

  // listen for a server welcome, which has all kinds of game information for us
  socket.on('gameSetup', function(data) {
    console.log("joined game! welcome package:", data);

    game.start(data);
    gameLoop();

    // set up a listener for snake spawns!
    socket.on('spawnSnake', function(data) {
      console.log("spawned, starting...", data);
      game.addSnake(data);
    });

    // immediately request a snake be made for this player
    socket.emit('makeSnake', { id: game.player.id });
  });

  // send user input to the server
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
        id: game.player.id,
        direction: direction
      });
    }
  });

  // listen for the server to tell us where to go
  socket.on('direction', function(data) {
    var id = parseInt(data.id);
    var direction = data.direction;

    for (var i=0, snake; i<game.snakes.length; i++) {
      snake = game.snakes[i];
      if (snake.id === data.id) {
        snake.changeDirection(direction);
      }
    }
  });
});

function gameLoop(){
  game.move();
  window.requestAnimationFrame(gameLoop);
}

var game = {
  size : 20,
  width : 40,
  height: 28,
  apples : [],
  snakes : [],
  player : {},

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
    color : color,
    speed : 5, // every 10 frames?
    direction : "right",
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
      this.direction = directions[getRandom(0,directions.length-1)];
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

      if(game.snakes.indexOf(this) != 0){
        var dirChange = getRandom(0,10);
        if(dirChange == 9) {
          var newDirection = directions[getRandom(0,directions.length-1)];
          this.changeDirection(newDirection);
        }
      }

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

      if(this.ticks < this.speed) {
        return;
      } else {
        this.ticks = 0;
      }

      if(blocked){
        this.die();
        // this.loseTail();
        return;
      }

      // From here on in, we are moving...

      game.checkCollisions();

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

      //check against other snakes
      var collide = false;

      // Collides against itself...

      for(var i = 0; i < game.snakes.length; i++) {
        var otherSnake = game.snakes[i];

        for(var j = 0; j < otherSnake.segments.length; j++) {
          var seg = otherSnake.segments[j];
          collide = collider(newHead,seg);
          if(collide){
            break;
          }
        }
        if(collide){
          break;
        }
      }

      // for(var i = 0; i < snek.segments.length; i++) {
      //   var segment = snek.segments[i];
      //   collide = collider(newHead,segment);
      //   if(collide){
      //     break;
      //   }
      // }

      if(collide) {
        this.die();
        this.loseTail();
        return;
      }

      this.makeSegment(newHead.x,newHead.y,"head");

      var lastSegment = this.segments[0];
      lastSegment.el.remove();
      this.segments.splice(0,1);
      this.draw();
    },
    die : function(){
      socket.emit('died', { id: this.id });

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

      // request a new snake, now that we're dead...
      socket.emit("makeSnake");
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
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}


function getRandom(min, max){
  return Math.round(min + Math.random() * (max-min));
}
