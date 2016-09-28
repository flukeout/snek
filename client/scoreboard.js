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
      var item = $("<li><span class='name'>"+s.name+"</span><span class='points'>"+s.points+"</span>");
      $(".scoreboard ul").append(item);
    }

    $(".winning-snake").text(winnerName + " wins!!").css("opacity","1");
  }
};
