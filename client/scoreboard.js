var scoreBoard = {
  update : function(players,winner){

    $(".scoreboard li").remove();

    var winnerName = "";

    players.sort(function(a,b){
      return a.points < b.points;
    })

    for(var i = 0; i < players.length; i++){
      var s = players[i];

      var gameSnake = getSnake(parseInt(s.id)) || {}; // Grabs the related snake from the game object

      var snakeColor = gameSnake.color || "#DDD";

      if(s.id == winner) {
        winnerName = s.name;
      }
      var item = $("<li><span class='snake-square'></span><span class='name'>"+s.name+"</span><span class='points'>"+s.points+"</span>");
      item.find(".snake-square").css("background",snakeColor);
      $(".scoreboard ul").append(item);
    }

    $(".winning-snake").text(winnerName + " wins!").css("opacity","1");
  }
};
