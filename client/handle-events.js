var buttons = {
  left : false,
  right: false,
  down : false,
  up : false,
  bomb : false
};

$(document).ready(function(){


  // Sends key press events to the server...
  // * For changing directions
  // * For dropping bombs
  $(document).on("keydown",function(event) {

    var keyResult = {
      direction: false,
      bomb: false
    };

    handleKey(event, keyResult, "down");

    // Only handle input "for game purposes" if
    // the client isn't currently trying to write
    // a chat message.

    var chatting = $(chat.chatInput).is(":focus");
    if (chatting) {
      return;
    }


    // Only send a directional input if the button isn't already pressed

    var direction = keyResult.direction;
    if(direction){
      var previousState = buttons[direction];

      if(previousState != true) {
        buttons[direction] = true;
        socket.emit('direction', {
          direction: direction
        });
      }
    }

    var bomb = keyResult.bomb;
    if(bomb) {
      socket.emit('dropBomb')
    }
  });


  // Sends direction key release events
  // This is needed for tracking if a snake is charging
  $(document).on("keyup",function(event) {

    var keyResult = {
      direction: false,
    };

    handleKey(event, keyResult, "up");

    var chatting = $(chat.chatInput).is(":focus");

    if (chatting) {
      return;
    }

    // Only handle input "for game purposes" if
    // the client isn't currently trying to write
    // a chat message.

    var direction = keyResult.direction;

    if(direction){
      buttons[direction] = false;
      socket.emit('releaseDirection', {
        direction: direction
      });
    }
  });

  chat.init();
});
