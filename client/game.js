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
  playerName : "",
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

    var storedName = localStorage.getItem("playerName");
    if(storedName) {
      this.playerName = storedName;
      chat.changeName(storedName);
    }

    $(".board").css("width",this.size * this.width);
    $(".board").css("height",this.size * this.height);

    socket.emit("makeSnake");
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

    $(".leader-boxes .box").css("background","#222");
    $(".leader-name").text("???");
    if(longest){
      $(".leader-name").text(longest.name);
      $(".leader-boxes .box:nth-child(-n+"+max+")").css("background",longest.color);
    }

  },

  addSnake : function(id, x, y, color, direction, length, name){
    var snake = makeSnake(id, x, y, color, direction, length, name);
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
    var bomb = {
      el : $("<div class='bomb'><div class='body'></div></div>"),
      x : x,
      y : y,
      id : id,
    }
    $(".board").append(bomb.el);
    playSound("beep");

    bomb.el.css("width",this.size).css("height",this.size);
    bomb.el.find(".body").css("background", color);
    bomb.el.css("transform","translateX(" + this.size * x + "px) translateY("+this.size * y+"px)");
    this.bombs.push(bomb);
  },

  removeBomb: function(id) {
    for(var i = 0; i < this.bombs.length; i++){
      var bomb = this.bombs[i];
      if(id === bomb.id){
        makeExplosion(bomb.x, bomb.y);
        bomb.el.remove();
        var bombIndex = this.bombs.indexOf(bomb);
        this.bombs.splice(bombIndex, 1);
      }
    }
  }
};
