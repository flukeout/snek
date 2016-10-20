var socket = io();

// When we connect, request a snake for this player
socket.on('gameSetup', function(msg){
  socket.emit("makeSnake");
});

var directions = ["up","down","left","right"];

var startX;              // Keeps track of the x position of a new move or gesture starts
var startY;              // Keeps track of the y position of a new move or gesture starts
var minTouch = 80;       // Minimum distance swiped to register a move
var startMoveTime = 0;   // Tracks the time a move was started, so we can check how long it took
var gestureDelta = 0;

var lastX = 0;
var lastY = 0;

var lastDirection;

$(document).ready(function(){

  // Sends a ""!!!"" message to help the player
  // identify where they are on the map.
  $("body").on("touchstart", ".beacon", function(e){
    socket.emit('sendChat', {
      message: "!!!"
    });
    return false; // Otherwise we end up dropping a bomb
  });

  // When we start a gesture, keep track of
  // * Where it started (x,y)
  // * When it started
  // We also let the player make multiple moves without having
  // to lift their finger.



  $("body").on("touchstart", function(e){
    var touch = e.originalEvent.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    var now = new Date();
    startMoveTime = now.getTime();
    
    lastX = touch.clientX;
    lastY = touch.clientY;
  });

  // When the player swipes around the controller,
  // we figure out when they've moved far enough in
  // any direction and let the game know.


  $("body").on("touchmove", function(e){

    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX;
    var y = touch.clientY;

    var xDelta = x - startX;
    var yDelta = y - startY;
    

    var totalDeltaX = x - lastX;
    var totalDeltaY = y - lastY;
    
    gestureDelta += Math.abs(totalDeltaX);
    gestureDelta += Math.abs(totalDeltaY);
    
    lastX = x;
    lastY = y;

    var totalDelta = Math.abs(xDelta) + Math.abs(yDelta);

    if(totalDelta > minTouch) {

      if(xDelta > minTouch) {
        socket.emit('direction', {
          direction: "right"
        });
        lastDirection = "right";
        endmove(x, y, "right");
      }

      if(xDelta < (minTouch * -1)) {
        socket.emit('direction', {
          direction: "left"
        });
        lastDirection = "left";
        endmove(x, y, "left");
      }

      if(yDelta > minTouch) {
        socket.emit('direction', {
          direction: "down"
        });
        endmove(x, y, "down");
      }

      if(yDelta < (minTouch * -1)) {
        socket.emit('direction', {
          direction: "up"
        });
        endmove(x, y, "up");
      }

    }
    return false;
  });

  $("body").on("touchend", function(e){
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX;
    var y = touch.clientY;

    checkShortTouch(x, y);
    endmove(x, y, false);
    gestureDelta = 0;

    return false;
    e.preventDefault();
  });

});



// When a player lifts their finger, let's see how
// far they siped and how long it took.
// If it's a short swipe and a short duration, it's probably meant to be a tap.

function checkShortTouch(x, y){

  var now = new Date();
  var endTime = now.getTime();
  var timeDelta = endTime - startMoveTime;

  $(".console").text(timeDelta + "," +  gestureDelta);

  if(timeDelta < 250 && gestureDelta < 5) {
    socket.emit('dropBomb');
  }
}


// When a move ends, we let the game know.
function endmove(x,y, direction){
  startX = x;  // Reset x position start for next move
  startY = y;  // Reset y position for the next move

  for(var i = 0; i < directions.length; i++) {
    if(directions[i] != direction) {
      socket.emit('releaseDirection', {
        direction: directions[i]
      });
    }
  }
}


// These are commented out button controls
// They provide an alternate input method
// =====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-=====-
// $(".pad-controls").on("touchstart",".button", function(e){
//
//   e.preventDefault();
//
//   var direction = $(this).attr("direction");
//   $(this).addClass("active");
//
//   if(directions.indexOf(direction) > -1) {
//     socket.emit('direction', {
//       direction: direction
//     });
//     return;
//   }
//
//   if(direction == "bomb") {
//     socket.emit('dropBomb')
//   }

//   return false;
// });
//
//
// $(".pad-controls").on("touchend",".button", function(){
//   var direction = $(this).attr("direction");
//   $(this).removeClass("active");
//
//   socket.emit('releaseDirection', {
//     direction: direction
//   });
// })
