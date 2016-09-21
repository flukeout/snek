var socket = io();

$(document).ready(function(){
  socket.emit("makeSnake");

  $(document).on("keydown",function(e){

    var direction, bomb;

    var keys = {};
    for (var start=65, end=90, i=start, key; i<=end; i++) {
      key = String.fromCharCode(i);
      keys[key] = i;
      key = String.fromCharCode(i+32);
      keys[key] = i+32;
    }

    switch(e.keyCode) {
      case keys.a:
      case keys.A:
        // game.snakes[0].boom();
        break;
      case keys.b:
      case keys.B:
        bomb = true;
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
        bomb = false;
    }

    if(direction){
      socket.emit('direction', {
        direction: direction
      });
    }

    if(bomb) {
      socket.emit('dropBomb')
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
      this.state = "open";
    } else {
      this.state = "closed";
      this.finishType();
    }
  },
  startType: function(){
    $(".keys-helper").hide();
    this.chatUI.show();
    this.chatInput.focus();
  },
  finishType: function(){
    $(".keys-helper").show();
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

socket.on('loseSegment', function(msg) {
  var snake = getSnake(msg.id);
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var showParticle = msg.showParticle;
  snake.loseSegment(x, y, showParticle);
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

socket.on('addBomb', function(msg){
  var x = parseInt(msg.x);
  var y = parseInt(msg.y);
  var id = parseInt(msg.id);
  var color = msg.color;
  game.addBomb(x,y,id,color);
});

socket.on('removeBomb', function(id){
  game.removeBomb(id);
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
  var type = msg.type;

  var snake = getSnake(msg.id);
  snake.die(x,y,type);

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

        var diff = gameSnake.segments.length - serverSnake.segments.length;
        if(diff > 0){
          // Game snake is longer - need to kill [diff] pieces
          while (diff--) {
            gameSnake.removeSegment(gameSnake.segments[0]);
          }
        } else {
          // Game snake is shorter - need to add a piece
          var tail = gameSnake.segments[0];
          diff = Math.abs(diff);
          while (diff--) {
            gameSnake.makeSegment(tail.x, tail.y, "tail");
          }
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

    var winnerName = "";

    players.sort(function(a,b){
      return a.points < b.points;
    })

    for(var i = 0; i < players.length; i++){
      var s = players[i];
      if(s.id == winner) {
        winnerName = s.name;
      }
      var item = $("<li><span class='name'>"+s.name+"</span><span class='points'>"+s.points+" pts.</span>");
      $(".scoreboard ul").append(item);
    }

    $(".winning-snake").text(winnerName + " wins!!").css("opacity","1");
  }
}

var game = {
  size : 20,
  width : 40,
  height: 28,
  apples : [],
  bombs: [],
  tickSpeed : 200,  // 8 frames difference
  tickSpeedModifier : 0,
  snakes : [],
  playerId : 0,
  elapsed : 0,
  mode : "game",
  winLength : 0,
  gameWon : function(players,winner){

    playSound("winner");

    $("[mode=game]").addClass("winner");

    scoreBoard.update(players, winner);

    var winnerSnake = getSnake(winner);

    setTimeout(function(){
      $("[mode=game]").removeClass("winner");
    },2500)

    var that = this;

    setTimeout(function(){
      that.changeMode("winner");
      $(".winning-snake").css("opacity","0");
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
    apple.el.css("transform","translateX(" + this.size * x + "px) translateY("+this.size * y+"px)");
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
  },
  addBomb: function(x, y, id,color) {
    console.log("Adding bomb at ",x,y);
    var bomb = {
      el : $("<div class='bomb'><div class='body'></div></div>"),
      x : x,
      y : y,
      id : id,
    }
    $(".board").append(bomb.el);

    bomb.el.css("width",this.size).css("height",this.size);
    bomb.el.find(".body").css("background", color);
    bomb.el.css("transform","translateX(" + this.size * x + "px) translateY("+this.size * y+"px)");
    this.bombs.push(bomb);
  },
  removeBomb: function(id) {
    for(var i = 0; i < this.bombs.length; i++){
      var bomb = this.bombs[i];
      if(id === bomb.id){

        // Make Bomb Puffs
        for(var i = 0; i < 8; i++){

          var options = {
            x : bomb.x * this.size,     // absolute non-relative position on gameboard
            y : bomb.y * this.size,     // absolute non-relative position on gameboard
            angle: getRandom(0,359),    // just on the x,y plane, works with speed
            zR : getRandom(-15,15),     // zRotation velocity
            oV : -.008,                 // opacity velocity
            width : getRandom(20,55),   // size of the particle
            className : 'puff',         // adds this class to the particle <div/>
            lifespan: 125,              // how many frames it lives
          }

          // Need to put this offset code into the makeParticle function
          // You should pass it an x,y of 0

          var offset = (options.width - this.size) / 2;
          options.x = options.x - offset;
          options.y = options.y - offset;
          options.height = options.width;
          options.speed = 1 + (2 * (1 - options.width / 50)); // The bigger the particle, the lower the speed

          makeParticle(options);
        }

        // Make an explosion
        makeAnimParticle(bomb.x, bomb.y);

        bomb.el.remove();
        var bombIndex = this.bombs.indexOf(bomb);
        this.bombs.splice(bombIndex, 1);
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
    phrases : ["ow","T_T","No!","Damn",'ahh',"!!?","wut", "u wot","fek","why??","BS","GG"],
    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
      makeSpawnParticle(x, y, this.color);
    },
    getHead : function(){
      return this.segments[this.segments.length -1];
    },
    say : function(message){
      // For displaying chat messages
      var head = this.getHead();
      var messageEl = $("<div class='message'><div class='body'>"+message+"</div></div>");
      $(".board").append(messageEl);

      var position = head.el.position();
      messageEl.css("transform","translateX("+head.x * 20+"px) translateY("+head.y*20+"px)");
      messageEl.find(".body").css("color",this.color);

      setTimeout(function(el) {
        return function() {
          el.remove();
        };
      }(messageEl), 1500);

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
    die : function(x,y,type){

      // Say something
      var that = this;
      setTimeout(function(){
        var index = parseInt(getRandom(0,that.phrases.length));
        that.say(that.phrases[index]);
      },140)

      // Make an explosion
      if(type != "quiet"){
        makeAnimParticle(x, y);
      }

      for(var i = 0; i < this.segments.length; i++){
        var seg = this.segments[i];
        seg.el.remove();
      }
      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);
    },
    boom : function(){
      var head = this.segments[this.segments.length - 1];
      makeBeam(head.x, head.y, this.direction || "left", this.color);
    },
    removeSegment : function(segment){
      // This removes the element and the segment from the array;
      var segmentIndex = this.segments.indexOf(segment);
      var el = segment.el;
      el.remove();
      this.segments.splice(segmentIndex,1);
    },
    loseSegment: function(x, y, showParticle, position) {

      if(this.segments.length > 1) {
        if(position == "head") {
          var segment = this.segments[this.segments.length - 1];
          segment.el.removeClass("gone").width(segment.el.width());
          segment.el.addClass("gone");
        }
      }

      playSound("bonk");

      if(showParticle || false) {
        var options = {
          x : x * this.size,
          y : y * this.size,
          angle : getRandom(0,359),
          speed : getRandom(0,2),
          // Ideas for random or range
          // speed : { range:  [0,10] },  // Picks random from 0 to 10
          // speed : { random: [0,10] },  // Picks random value in array. 0 or 10
          // speed : 10,                  // Sets speed to 10
          zV : getRandom(5,10),
          xRv : getRandom(0,3),
          yRv : getRandom(0,3),
          zRv : getRandom(0,3),
          gravity : .4,
          // oV : -.02,
          lifespan : getRandom(15,18),
          color: this.color,
        }
        makeParticle(options);
      }

    },
    loseHead : function(){
      var head = this.segments[this.segments.length - 1];
      this.loseSegment(head.x,head.y,true, "head")
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
