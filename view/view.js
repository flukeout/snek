var socket = io();

$(document).ready(function(){
  socket.emit("makeSnake");

  $(document).on("keydown",function(e){

    var direction;

    switch(e.keyCode) {
      case 71:
        game.changeMode("game");
        break;
      case 87:
        game.changeMode("winner");
        break;
      case 65:
        game.snakes[0].boom();
        break;
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
      case 13:
        chat.enterHit();
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


  chat.init();
});

var chat = {
  state : "closed",
  init : function(){
    this.chatUI = $(".chat-ui");
    this.chatInput = this.chatUI.find("input");
  },
  chatUI: "",
  chatInput : "",
  enterHit : function(){
    if(this.state == "closed") {
      this.startType();
      this.state ="open";
    } else {
      this.state = "closed";
      this.finishType();
    }
  },
  startType: function(){
    this.chatUI.show();
    this.chatInput.focus();

  },
  finishType: function(){
    this.chatUI.hide();
    var message = this.chatInput.val();
    this.chatInput.val("");
    this.chatInput.blur();
    if(message.length > 0) {
      this.sendMessage(message);
    }

  },
  sendMessage: function(message){
    socket.emit('sendChat', {
      message: message
    });
  }
}

socket.on('newChat', function(msg){
  var snake = getSnake(msg.id);
  snake.say(msg.message);
});

socket.on('gameOver', function(msg) {
  var players = msg.players;
  var winner = msg.winner;
  game.gameWon(players,winner);
});

socket.on('gameMode', function(msg) {
  var mode = msg.mode;
  game.changeMode(mode);
});

socket.on('serverTick', function(msg){
  var snakes = msg.snakes;
  updateSnakes(snakes);
  game.move();
});

socket.on('loseHead', function(msg){
  var snake = getSnake(msg.id);
  snake.loseHead();
});

socket.on('gameSetup', function(msg){
  var width = parseInt(msg.width);
  var height = parseInt(msg.height);
  var id = parseInt(msg.id);
  var apples = msg.apples;
  var snakes = msg.snakes;
  var winLength = msg.winLength;
  game.setup(width,height,id, apples, snakes, winLength);
});

socket.on('playerDisconnect', function(msg){
  game.removePlayer(msg.id);
});

socket.on('snakeEat', function(msg){
  var id = msg;
  var snake = getSnake(id);
  snake.eat();
});

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
  var x = msg.x;
  var y = msg.y;

  var snake = getSnake(msg.id);
  snake.die(x,y);

});

// Updates all of the snakes...

function updateSnakes(snakes){


  for(var i = 0; i < snakes.length; i++){
    var serverSnake = snakes[i];

    for(var j = 0; j < game.snakes.length; j++) {
      var gameSnake = game.snakes[j];
      if(serverSnake.id === gameSnake.id) {
        gameSnake.direction = serverSnake.direction;
        gameSnake.points = serverSnake.points;

        if(gameSnake.segments.length > serverSnake.segments.length){
          // Game snake is longer - need to kill a piece
          gameSnake.removeSegment(gameSnake.segments[0]);
        } else if (gameSnake.segments.length < serverSnake.segments.length) {
          // Game snake is shorter - need to add a piece
          gameSnake.makeSegment(0,0);
        }

        // Then set all the pieces to equal each other
        for(var k = 0; k < gameSnake.segments.length; k++) {
          var serverSegment = serverSnake.segments[k];
          if(serverSegment){
            gameSnake.segments[k].x = serverSegment.x;
            gameSnake.segments[k].y = serverSegment.y;
          }
        }
      }
    }
  }
}

var scoreBoard = {
  update : function(players,winner){

    $(".scoreboard li").remove();
    $(".scoreboard .winning-snake").text(winner + " wins!!");

    for(var i = 0; i < players.length; i++){
      var s = players[i];
      var item = $("<li><span class='name'>"+s.name+"</span><span class='points'>"+s.points+" pts.</span>");
      $(".scoreboard ul").append(item);
    }


  }
}

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
  mode : "game",
  winLength : 0,
  gameWon : function(players,winner){
    console.log(players,winner);

    // var winner = winners[0];
    // var that = this;
    //
    scoreBoard.update(players, winner);
    //
    var that = this;

    setTimeout(function(){
      that.changeMode("winner");
    },2000);

  },
  changeMode : function(type){
    this.game = type;
    $("[mode]").addClass("hidden");
    $("[mode="+type+"]").removeClass("hidden");
  },
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
  setup : function(width,height,id,apples,snakes,winlength) {
    console.log(width,height);

    this.winLength = winlength;
    this.changeMode("game");

    for(var i = 0; i < this.winLength; i++) {
      var box = $("<div class='box'>");
      $(".leader-boxes").append(box);
    }

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

    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);
  },
  move : function(){

    var max = 0;
    var longest;

    for(var i = 0 ; i < this.snakes.length; i++ ){
      var s = this.snakes[i];
      s.move();
      if(s.segments.length > max) {
        longest = s;
        max = s.segments.length;
      }
    }

    if(longest){
      $(".leader-boxes .box").css("background","#222");
      $(".leader-boxes .box:nth-child(-n+"+max+")").css("background",longest.color);
    }

  },
  killSnake : function(id,x,y){

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
    name : "Snakeman",
    points : 0,
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
    getHead : function(){
      return this.segments[this.segments.length -1];
    },
    say : function(message){

      console.log("Snake says:", message);

      var head = this.getHead();
      var messageEl = $("<div class='message'><div class='body'>"+message+"</div></div>");
      $(".board").append(messageEl);

      var position = head.el.position();
      messageEl.css("transform","translateX("+head.x * 20+"px) translateY("+head.y*20+"px)");
      console.log(position);


      setTimeout(function(el) {
        return function() {
          el.remove();
        };
      }(messageEl), 2000);

    },
    makeSegment : function(x,y,place){
      var segmentEl = $("<div class='snek'><div class='body'></div></div>");

      var segmentDetails = {
        x : x | 0,
        y : y | 0,
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
      playSound("eat");
    },
    move : function(){
      this.draw();
    },
    die : function(x,y){

      // Make an explosion
      makeAnimParticle(x, y);

      for(var i = 0; i < this.segments.length; i++){
        var seg = this.segments[i];
        seg.el.remove();
      }
      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);
    },
    boom : function(){
      var head = this.segments[this.segments.length - 1];
      makeBeam(head.x, head.y, "left", this.color);
    },
    removeSegment : function(segment){
      // This removes the element and the segment from the array;
      var segmentIndex = this.segments.indexOf(segment);
      var el = segment.el;
      el.remove();
      this.segments.splice(segmentIndex,1);
    },
    loseHead : function(){
      var head = this.segments[this.segments.length - 1];
      head.el.removeClass("gone").width(head.el.width());
      head.el.addClass("gone");

      console.log("adding crash");
      $(".border").removeClass("crash shake").width($(".board").width());
      $(".border").addClass("crash");

      // for(var i = 0; i < this.segments.length; i++) {
      //   var seg = this.segments[i];
      //   var deg = getRandom(-5,5);
      //   var x = getRandom(-1,1);
      //   var y = getRandom(-1,1);
      //   seg.el.find(".body").css('transform','rotateZ('+ deg + 'deg) translateY('+y+'px) translateX('+x+'px)');
      // }
      playSound("bonk");
      makeParticle(head.x * this.size, head.y * this.size, 10, 225, this.color);
      // TODO Should pass the game x,y coordinates, not the pixel value...
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



// Animation loop for the Particle Effects
loop();
function loop(){
  for(var i = 0; i < particles.length; i++){
    var p = particles[i];
    p.move();
  }
  requestAnimationFrame(loop);
}


function getSnake(id){
  for(var i = 0; i < game.snakes.length; i++){
    var s = game.snakes[i];
    if(s.id === id) {
      return s;
    }
  }
}
