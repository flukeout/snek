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
