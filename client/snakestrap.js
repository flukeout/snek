$(document).ready(function(){

  $(document).on("keydown",function(event) {
    var keyDownResult = {
      direction: false,
      bomb: false,
      warp : false
    };

    handleKeyDown(event, keyDownResult);

    var chatting = $(chat.chatInput).is(":focus");

    if (chatting) {
      return;
    }

    // Only handle input "for game purposes" if
    // the client isn't currently trying to write
    // a chat message.

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

    var warp = keyDownResult.warp;
    if(warp) {
      socket.emit('warpSnake')
    }

  });

  chat.init();
});
