var collider = require('./collider');
var game, io;

var Snake = function(details, _game) {
  // this SHOULD be safe?
  game = _game;
  io = _game.io;

  this.id = details.id;
  this.x = details.x;
  this.y = details.y;
  this.length = details.length;
  this.color = details.color;

  this.ticks = 0;
  this.size = 4;
  this.segments = [];
  this.moved = false;
  this.direction = undefined;
  this.nextDirection = "";
  this.directionQ = [];
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

  move : function() {

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

  die : function() {

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

    setTimeout(function(){
      game.addSnake(snakeDetails);
    },1000)


  },

  loseTail : function(){
    if(this.segments.length > 1) {
      io.emit('loseTail', {id: this.id,});
      var tail = this.segments[0];
      this.segments.splice(0,1);
    }
  }
};