var collider = require('./collider');
var game, io;

var Snake = function(details, _game) {

  game = details.game || _game;
  io = details.io || _game.io;

  this.id = details.id;   // Each snake in the game has a unique ID
  this.x = details.x;     
  this.y = details.y;
  this.length = details.length;
  this.color = details.color;

  this.ticks = 0;
  this.points = 0;
  this.name = details.name || "ServerSnake";
  this.size = details.size || 4;
  this.segments = (details.segments || []).slice();
  this.direction = details.direction || undefined;
  this.moving = !!details.moving;
  this.nextDirection = details.nextDirection || "";
  this.directionQ = [];
  this.eventQ = [];
  this.warpCharge = 12;
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

    if(this.direction == direction) {
      if(this.charge >= this.warpCharge) {
        this.eventQ.push("warp");
        this.charge = 0;
      }
    }

    this.directionQ.push(direction);
    this.buttons[direction] = true;
  },

  releaseDirection: function(direction){
    this.buttons[direction] = false;
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

  // Checks to see which segments were in a bomb blast
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

  // When a snake eats an apple, we...
  // * Add a segment
  // * Notify all the clients
  eat : function(){
    var tail = this.segments[0];
    this.makeSegment(tail.x,tail.y,"tail");
    io.emit('snakeEat', this.id);
  },

  // When a snake moves
  move : function(futureSnakes) {

    // Check the event queue for upcoming warps or bombs
    if(this.eventQ.length > 0) {
      // Grab the next event
      var nextEvent = this.eventQ.splice(0, 1)[0];
      if(nextEvent == "bomb") {
        this.dropBomb();
      }
      if(nextEvent == "warp") {
        this.warp();
      }
    }

    // Check if there are any directions in the queue
    if(this.directionQ.length > 0) {
      var nextDirection = this.directionQ[0];
      this.changeDirection(nextDirection);
      this.directionQ.splice(0, 1);

      // If the player isn't fully charged, and changes direction, reset the charge
      if(this.direction != nextDirection && this.charge < this.warpCharge) {
        this.charge = 0;
      }
      this.direction = this.nextDirection;
    }

    // Increase the snake charge if the player is holding
    // down the direction key for the direction they are already moving
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
      }
    } else {
      this.makeSegment(newHead.x,newHead.y,"head");
      this.segments.splice(0,1);
    }
  },

  // Checks collisions against "future snakes"
  // We need to check collisions against the upcoming position of each snake,
  // and not the current one.
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
      if (!snake.moving) {
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

  // Returns the "head" segment of the snake
  getHead : function(){
    return this.segments.slice(-1)[0];
  },

  // Causes the snake to lose the "head" segment
  loseHead : function(){
    if(this.segments.length > 1) {
      io.emit('loseHead', {id: this.id,});
      this.segments.splice(this.segments.length - 1, 1);
    }
  },

  // Returns the last, or "tail", segment of the snake
  getTail : function(){
    return this.segments[0];
  },

  // Respawns the snake
  respawn : function(){
    var snakeDetails = {
      id : this.id,
      color: this.color,
      name : this.name || "jammer"
    }

    // Make sure the player whose snake this was is still in the game
    if(game.players[this.id]){
      game.addSnake(snakeDetails);
    }
  },

  // Removes a specific segment from the snake
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

  // Dropbs a bomb (and loses a tail segment)
  dropBomb : function() {
    if (this.segments.length>1) {
      var tail = this.getTail();
      game.addBomb(tail.x, tail.y, this.color, this.id);
      this.loseSegment(this.segments[0], false);
    }
  },

  // Warps the snake 5 steps forward, ignoring any collision detection
  warp : function(){

    var segments = [];
    for(var i = 0; i < 5; i++) {
      var head = this.segments.slice(-1)[0];

      var newHead = { x: head.x, y: head.y };

      var d = this.direction;
      if (d === "up") {
        newHead.y--;
        if(newHead.y < -1) {
          newHead.y = game.height;
        }
      }
      else if (d === "down")  {
        newHead.y++;
        if(newHead.y > game.height) {
          newHead.y = -1;
        }
      }
      else if (d === "right") {
        newHead.x++;
        if(newHead.x > game.width) {
          newHead.x = -1;
        }
      }
      else if (d === "left")  {
        newHead.x--;
        if(newHead.x < -1) {
          newHead.x = game.width;
        }
      }
      this.makeSegment(newHead.x,newHead.y,"head");
      this.segments.splice(0,1);

      var tail = this.segments[0];
      segments.push(tail);

      game.checkCollisions(); // While warping, check if eating any apples
    }

    io.emit('warpSnake', {
      id: this.id,
      segments : segments
    });
  },

  // This kills the snake
  die : function(type, norespawn) {

    var head = this.segments.length > 0 ? this.getHead() : this.tombStone;

    io.emit('killSnake', {
      id: this.id,
      x: head.x,
      y: head.y,
      type : type
    });

    // Removes this snake from the game
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

  // The snake loses it's tail
  loseTail : function(){
    if(this.segments.length > 1) {
      io.emit('loseTail', {id: this.id,});
      var tail = this.segments[0];
      this.segments.splice(0,1);
    }
  }
};