var socket = io();

var directions = ["left","right","up","down"];

// socket.on('gameSetup', function(msg){
//   var width = parseInt(msg.width);
//   var height = parseInt(msg.height);
//   var id = parseInt(msg.id);
//   player.id = id;
// });

socket.emit("make-snake");

// var player = {
//   id : 0
// }

$(document).ready(function(){

  $(document).on("keydown",function(e){

    var direction;
    switch(e.keyCode) {
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
      default:
        direction = false;
    }

    console.log(direction);
    if(direction){
      socket.emit('direction', {
        id: player.id,
        direction: direction
      });
    }
  });


});

