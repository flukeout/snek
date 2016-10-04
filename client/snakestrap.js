var buttons = {
  left : false,
  right: false,
  down : false,
  up : false,
  bomb : false
}

$(document).ready(function(){

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
    // Only send a directional input if the button isn't already pressed

    var direction = keyResult.direction;
    if(direction){
      var previousState = buttons[direction];

      if(previousState != false) {
        buttons[direction] = false;
        socket.emit('releaseDirection', {
          direction: direction
        });
      }
    }
  });


  $(document).on("keydown",function(event) {

    var keyResult = {
      direction: false,
      bomb: false,
      warp : false
    };

    handleKey(event, keyResult, "down");

    var chatting = $(chat.chatInput).is(":focus");

    if (chatting) {
      return;
    }

    // Only handle input "for game purposes" if
    // the client isn't currently trying to write
    // a chat message.

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

   // var warp = keyResult.warp;
   //  if(warp) {
   //    socket.emit('warpSnake')
   //  }
   // console.log(buttons);

  });

  chat.init();
});
