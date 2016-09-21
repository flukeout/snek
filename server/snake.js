var collider = require('./collider');
var game, io;

var dist = function(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return Math.sqrt(dx*dx + dy*dy);
};

var Snake = function(details, _game) {
  // this SHOULD be safe?
  game = _game;
  io = _game.io;

  this.id = details.id;
  this.x = details.x;
  this.y = details.y;
  this.length = details.length;
  this.color = details.color;
  this.debug = details.debug;

  this.ticks = 0;
  this.points = 0;
  this.name = "ServerSnake";
  this.size = 4;
  this.segments = [];
  this.deathBed = false;
  this.moved = false;
  this.direction = undefined;
  this.nextDirection = "";
  this.directionQ = []; // This should be genereal
  this.eventQ = [];
};

module.exports = Snake;

Snake.prototype = {

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

  getSegmentsNear: function(x, y, distance) {
    var d = Math.ceil(distance/2);
    var segments = [];
    this.segments.forEach(segment => {
      if(dist(segment.x, segment.y, x, y) <= d) {
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

  move : function() {
    if(this.eventQ.length > 0) {
      var nextEvent = this.eventQ[0];

      if(nextEvent == "bomb") {
        this.dropBomb();
      }

      // this.changeDirection(nextDirection);
      // this.direction = this.nextDirection;
      // this.moving = true;
      this.eventQ.splice(0, 1);
    }

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

    if(game.mode != "game" ) {
      collide = false;
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

  respawn : function(){
    // console.log("Respawn Snake");
    var snakeDetails = {
      id : this.id,
      color: this.color
    }

    game.addSnake(snakeDetails);
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
      this.deathBed = lastRemoved;
    }
  },
  dropBomb : function() {
    if (this.segments.length>1) {
      var tail = this.getTail();
      game.addBomb(tail.x, tail.y, this.color, this.id);
      this.loseSegment(this.segments[0], false);
    }
  },
  die : function(type) {
    // console.log("A " + type  + " death");

    var head = this.segments.length > 0 ? this.getHead() : this.deathBed;

    io.emit('killSnake', {
      id: this.id,
      x: head.x,
      y: head.y,
      type : type
    });

    var snakeIndex = game.snakes.indexOf(this);
    game.snakes.splice(snakeIndex, 1);

    var that = this;
    setTimeout(function(){
      if(game.mode == "game"){
        that.respawn();
      }
    },1000);
  },
  loseTail : function(){
    if(this.segments.length > 1) {
      io.emit('loseTail', {id: this.id,});
      var tail = this.segments[0];
      this.segments.splice(0,1);
    }
  }
};