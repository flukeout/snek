$(document).ready(function(){
  socket.emit("makeSnake");

  $(document).on("keydown",function(event) {
    var keyDownResult = {
      direction: false,
      bomb: false
    };

    handleKeyDown(event, keyDownResult);

    var direction = keyDownResult.direction;
    if(direction){
      socket.emit('direction', {
        direction: direction
      });
    }

    var bomb = keyDownResult.bomb;
    if(bomb) {
      socket.emit('dropBomb')
    }
  });

  chat.init();
});
