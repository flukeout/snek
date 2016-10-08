var game = {
  gridSize : 20,   // This is the size of the grid in pixels

  apples : [],     // Keeps track of apples
  bombs: [],       // Keeps track of bombs
  snakes : [],     // Keeps track of snakes

  playerId : 0,
  playerName : "",

  mode : "game",

  gameWon : function(players,winner){
    playSound("winner");

    $("[mode=game]").addClass("winner");

    scoreBoard.update(players, winner);

    var winnerSnake = getSnake(winner);

    setTimeout(function(){
      $("[mode=game]").removeClass("winner");
    },2500);

    var that = this;
    setTimeout(function(){
      console.log("changing mode to winn");
      that.changeMode("winner");
      $(".winning-snake").css("opacity","0");
    },2000);
  },


  changeMode : function(type){
    $("[mode]").addClass("hidden");
    $("[mode="+type+"]").removeClass("hidden");
  },


  changeDirection : function(id,direction,ticks, x, y){
    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(id === snake.id){
        snake.changeDirection(direction, ticks, x ,y);
      }
    }
  },


  // Sets up visual properties of the board
  // Height, width and the leading snake indicator
  setupBoard : function(width, height, winLength){
    $(".leader-boxes .box").remove();
    for(var i = 0; i < winLength; i++) {
      var box = $("<div class='box'>");
      $(".leader-boxes").append(box);
    }

    $(".board").css("width",this.gridSize * width);
    $(".board").css("height",this.gridSize * height);
  },

  // Starts the "game" up.
  setup : function(width, height, id, apples, snakes, winLength) {

    this.setupBoard(width, height, winLength);
    this.changeMode("game");

    for(var i = 0; i < apples.length; i++) {
      var apple = apples[i];
      this.addApple(apple.x,apple.y,apple.id);
    }

    // Adds snakes from the server...
    for(var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      this.addSnake(snake.id,snake.x, snake.y, snake.color, "", snake.length);
    }

    this.playerId = id;

    var storedName = localStorage.getItem("playerName");
    if(storedName) {
      this.playerName = storedName;
      chat.changeName(storedName);
    }

    // Request a snake for this player
    socket.emit("makeSnake");
  },


  // Moves each snake
  move : function(){
    var max = 0;
    var longest;

    for(var i = 0 ; i < this.snakes.length; i++ ){
      var snake = this.snakes[i];
      snake.move();
      if(snake.segments.length > max) {
        longest = snake;
        max = snake.segments.length;
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

    for(var i = 0; i < this.snakes.length; i++) {
      var snake = this.snakes[i];
      if(snake.id == parseInt(id)){
        return;
      }
    }

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

    apple.el.css("width",this.gridSize).css("height",this.gridSize);
    apple.el.css("transform","translateX(" + this.gridSize * x + "px) translateY("+this.gridSize * y+"px)");
    this.apples.push(apple);
  },

  removePlayer : function(id) {
    var snake = getSnake(id);
    if(snake){
      snake.die();
    }
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

    bomb.el.css("width",this.gridSize).css("height",this.gridSize);
    bomb.el.find(".body").css("background", color);
    bomb.el.css("transform","translateX(" + this.gridSize * x + "px) translateY("+this.gridSize * y+"px)");
    this.bombs.push(bomb);
  },

  removeBomb: function(id) {
    for(var i = 0; i < this.bombs.length; i++){
      var bomb = this.bombs[i];
      if(id === bomb.id){
        makeExplosion(bomb.x * this.gridSize, bomb.y * this.gridSize, 60);
        bomb.el.remove();
        var bombIndex = this.bombs.indexOf(bomb);
        this.bombs.splice(bombIndex, 1);
      }
    }
  }
};
