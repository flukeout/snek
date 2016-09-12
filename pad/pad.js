var socket = io();

var directions = ["left","right","up","down"];

socket.emit("makeSnake");

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

    if(direction){
      socket.emit('direction', {
        direction: direction
      });
    }
  });
});

