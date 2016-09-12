var directions = ["left","right","up","down"];

$(document).ready(function(){
  game.start();
  gameLoop();

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
      game.snakes[0].changeDirection(direction);
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
  start : function(){
    this.addApple();
    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);

    for(var i = 0; i < 1; i++){
      this.addSnake();
    }
  },
  move : function(){
    for(var i = 0 ; i < this.snakes.length; i++ ){
      var s = this.snakes[i];
      s.move();
    }
  },
  addSnake : function(){
    var id = getRandom(0,100000000);
    var snake = makeSnake(id);
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

function makeSnake(id){
  var snek = {
    x : 0,
    y : 0,
    id : id,
    size : 20,
    length: 10,
    moving : false,
    ticks : 0,
    color : "#FFFFFF",
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
      this.color = colors[getRandom(0,colors.length)];
      this.x = getRandom(0,game.width-1);
      this.y = getRandom(0,game.height-1);

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
      game.addSnake();
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
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}


function getRandom(min, max){
  return Math.round(min + Math.random() * (max-min));
}
