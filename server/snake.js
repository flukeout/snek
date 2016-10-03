var collider = require('./collider');
var game, io;

var dist = function(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return Math.sqrt(dx*dx + dy*dy);
};

var Snake = function(details, _game) {
  // this SHOULD be safe?
  game = details.game || _game;
  io = details.io || _game.io;

  this.id = details.id;
  this.x = details.x;
  this.y = details.y;
  this.length = details.length;
  this.color = details.color;

  this.debug = !!details.debug;
  this.moving = !!details.moving;

  this.ticks = 0;
  this.points = 0;
  this.name = details.name || "ServerSnake";
  this.size = details.size || 4;
  this.segments = (details.segments || []).slice();
  this.direction = details.direction || undefined;
  this.nextDirection = details.nextDirection || "";
  this.directionQ = [];
  this.eventQ = [];
  this.warpCharge = 10; // need to charge at least 10 to warp
  this.buttons = {
    up : false,
    down : false,
    left: false,
    right: false
  }
  this.chargeDirection = undefined;
  this.heldDirection = undefined;
  this.charge = 0;
};

module.exports = Snake;

Snake.prototype = {

  pushDirection: function(direction){
    this.directionQ.push(direction);
    this.buttons[direction] = true;
  },

  releaseDirection: function(direction){
    if(this.charge >= this.warpCharge) {
      this.eventQ.push("warp");
    }
    this.buttons[direction] = false;
    this.charge = 0;
  },

  changeDirection : function(newDirection){
    this.moving = true;

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

  init : function(io){
    this.io = io;
    for(var i = 0, segCount=this.length; i < segCount; i++) {
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

    this.length++;
  },

  // we're using a 5x5 bomb kernel
  getSegmentsNear: function(x, y, bombRadius) {
    var segments=[],
        sx, sy,
        d = Math.floor(bombRadius/2)
        x1 = x-d,
        x2 = x+d,
        y1 = y-d,
        y2 = y+d;

    this.segments.forEach(segment => {
      sx = segment.x;
      sy = segment.y;
      if (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2) {
        segments.push(segment);
      }
    });

    return segments;
  },

  eat : function(){
    var tail = this.segments[0];
    this.makeSegment(tail.x,tail.y,"tail");
    io.emit('snakeEat', this.id);
  },

  move : function(futureSnakes) {

    if(this.eventQ.length > 0) {
      var nextEvent = this.eventQ.splice(0, 1)[0];

      if(nextEvent == "bomb") {
        this.dropBomb();
      }

      if(nextEvent == "warp") {
        this.warp();
      }
    }

    if(this.directionQ.length > 0) {
      var nextDirection = this.directionQ[0];
      this.changeDirection(nextDirection);
      this.directionQ.splice(0, 1);
      this.direction = this.nextDirection;
    }

    if(this.buttons[this.direction] == true) {
      this.charge++;
    }

    var head = this.segments.slice(-1)[0];
    var next = this.segments.slice(-2,-1);
    if (next.length===0) { next = false; } else { next = next[0]; }

    var newHead = { x: head.x, y: head.y };
    var newNext = next==false ? false : { x: next.x, y: next.y };

    var collide = false;

    if(this.moving && game.mode === "game" && futureSnakes) {
      // check if any collisions will occur for this snake,
      // but don't resolve them quite yet.
      collide = this.processCollisions(futureSnakes, head, newHead, newNext);
    }

    // resolve any collisions, if any were detected.
    if(collide) {
      io.emit('loseHead', {id: this.id,});
      if(this.segments.length > 1) {
        this.segments.splice(0,1);

        // if you ran onto a snake, they get sections
        if (collide.id) {
          var victor = game.findPlayerSnake(collide.id);
          if (victor) {
            var tail = victor.getTail();
            victor.makeSegment(tail.x, tail.y, "tail");
          }
        }

      } else {
        this.die();
        game.cleanupDebug();
      }
    } else {
      this.makeSegment(newHead.x,newHead.y,"head");
      this.segments.splice(0,1);
    }
  },

  processCollisions: function(futureSnakes, head, newHead, newNext) {
    // check for collisions with the level wall
    var wallCollision  = (head.x >= game.width - 1 && this.direction == "right") |
                         (head.y >= game.height - 1 && this.direction == "down") |
                         (head.x <= 0 && this.direction == "left") |
                         (head.y <= 0 && this.direction == "up");

    if (wallCollision) {
      return true;
    }

    // Check collisions with apples or bombs. These are soft
    // scollisions and don't lead to actual collision detection
    game.checkCollisions();

    // See if we need to move the snake's head due to a collision
    var d = this.direction;
         if (d === "up")    { newHead.y--; if(newNext) newNext.y--; }
    else if (d === "down")  { newHead.y++; if(newNext) newNext.y++; }
    else if (d === "right") { newHead.x++; if(newNext) newNext.x++; }
    else if (d === "left")  { newHead.x--; if(newNext) newNext.x--; }

    // Check if the snake has collided with itself, if it
    // hasn't collided with the level wall
    if(this.moving) {
      for(var i=0; i<this.segments.length; i++) {
        var segment = this.segments[i];
        if(collider(segment, newHead)) {
          // collided with self!
          return true;
        }
      }
    }

    var otherCollision = false;

    // If it hasn't yet collided with the wall, or itself, check collisions
    // with other snakes (as they exist next frame).
    for (var i=0; i<futureSnakes.length; i++) {
      var snake = futureSnakes[i];

      // Ignore collisions with ourselves
      if (snake.id === this.id) {
        continue;
      }

      // Ignore collisions with just-spawned
      // snakes (= not moving snake)
      if (!snake.debug && !snake.moving) {
        continue;
      }

      for(var si = 0; si<snake.segments.length; si++) {
        var segment = snake.segments[si];

        // plain collision
        if(collider(segment, newHead, newNext)) {
          otherCollision = snake;
        }

        // we need a secondary check if we're dealing with single-segment snakes.
        if (this.segments.length===1 && snake.segments.length===1) {
          let currentHead      = this.getHead();
          let currentOtherHead = game.snakes[i].getHead();
          let futureOtherHead  = snake.getHead();
          if(collider(currentOtherHead, newHead) || collider(futureOtherHead, currentHead)) {
            otherCollision = snake;
          }
        }
      }
    }

    return otherCollision;
  },

  getHead : function(){
    // return this.segments[this.segments.length - 1];
    return this.segments.slice(-1)[0];
  },

  loseHead : function(){
    if(this.segments.length > 1) {
      io.emit('loseHead', {id: this.id,});
      this.segments.splice(this.segments.length - 1, 1);
    }
  },

  getTail : function(){
    return this.segments[0];
  },

  respawn : function(debug){
    console.log("Respawn Snake");
    var snakeDetails = {
      id : this.id,
      color: this.color,
      debug: this.debug,
      name : this.name || "jammer"
    }

    // Make sure the player whose snake this was is still in the game
    if(game.players[this.id]){
      game.addSnake(snakeDetails);
    }
  },

  loseSegment: function(segment, showParticle) {
    segment.id = this.id;

    segment.showParticle = showParticle;
    io.emit('loseSegment', segment);

    // remove segment at the tail
    var lastRemoved = false;
    if(this.segments.length > 0) {
      lastRemoved = this.segments.splice(0,1)[0];
    }

    // we need the last segment if the snake is now dead
    if(this.segments.length === 0) {
      this.tombStone = lastRemoved;
    }
  },

  dropBomb : function() {
    if (this.segments.length>1) {
      var tail = this.getTail();
      game.addBomb(tail.x, tail.y, this.color, this.id);
      this.loseSegment(this.segments[0], false);
    }
  },

  warp : function(){
    // OK SO - this warps the snake forward 5 spots
    // Ignore collision detection

    var segments = [];
    for(var i = 0; i < 5; i++) {
      var head = this.segments.slice(-1)[0];

      var newHead = { x: head.x, y: head.y };

      var d = this.direction;
           if (d === "up")    { newHead.y--; }
      else if (d === "down")  { newHead.y++; }
      else if (d === "right") { newHead.x++; }
      else if (d === "left")  { newHead.x--; }

      this.makeSegment(newHead.x,newHead.y,"head");
      this.segments.splice(0,1);

      var tail = this.segments[0];
      segments.push(tail);
    }

    io.emit('warpSnake', {
      id: this.id,
      segments : segments
    });
  },

  die : function(type, norespawn) {


    var head = this.segments.length > 0 ? this.getHead() : this.tombStone;

    io.emit('killSnake', {
      id: this.id,
      x: head.x,
      y: head.y,
      type : type
    });

    var snakeIndex = game.snakes.indexOf(this);
    game.snakes.splice(snakeIndex, 1);

    if (!norespawn) {
      var that = this;
      setTimeout(function(){
        if(game.mode == "game"){
          that.respawn();
        }
      },1000);
    }
  },
  loseTail : function(){
    if(this.segments.length > 1) {
      io.emit('loseTail', {id: this.id,});
      var tail = this.segments[0];
      this.segments.splice(0,1);
    }
  }
};