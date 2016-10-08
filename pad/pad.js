var socket = io();

socket.on('gameSetup', function(msg){
  socket.emit("makeSnake");
});

var directions = ["up","down","left","right"];

var startX;
var startY;
var minTouch = 40;
var moved = false;
var startMoveTime = 0;

function measureTime(){

  var now = new Date();
  var endTime = now.getTime();

  var delta = endTime - startMoveTime;
  if(delta < 150) {
    socket.emit('dropBomb');
  }
}

function endmove(x,y){

  var xDelta = Math.abs(x - startX);
  var yDelta = Math.abs(y - startY);

  var totalDelta = xDelta + yDelta;

  startX = x;
  startY = y;
  moved = false;
  socket.emit('releaseDirection', {
    direction: "up"
  });
  socket.emit('releaseDirection', {
    direction: "down"
  });
  socket.emit('releaseDirection', {
    direction: "left"
  });
  socket.emit('releaseDirection', {
    direction: "right"
  });
}


$(document).ready(function(){


  $("body").on("touchstart", ".beacon", function(e){

    socket.emit('sendChat', {
      message: "!!!"
    });

    e.preventDefault();
    return false;

  });


  $("body").on("touchstart", function(e){
    var touch = e.originalEvent.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;

    var now = new Date();
    startMoveTime = now.getTime();


  });


  $("body").on("touchmove", function(e){

    var touch = e.originalEvent.changedTouches[0];

    var x = touch.clientX;
    var y = touch.clientY;

    var xDelta = x - startX;
    var yDelta = y - startY;


    var totalDelta = Math.abs(xDelta) + Math.abs(yDelta);

      $(".console").text(xDelta + " " +  moved);
      if(totalDelta > minTouch && moved == false) {


      if(xDelta > minTouch) {
        socket.emit('direction', {
          direction: "right"
        });
        endmove(x,y);
      }

      if(xDelta < (minTouch * -1)) {
        socket.emit('direction', {
          direction: "left"
        });
        endmove(x,y);
      }

      if(yDelta > minTouch) {
        socket.emit('direction', {
          direction: "down"
        });
        endmove(x,y);
      }

      if(yDelta < (minTouch * -1)) {
        socket.emit('direction', {
          direction: "up"
        });
        endmove(x,y);
      }


    }

    return false;

  });

  $("body").on("touchend", function(e){

    var touch = e.originalEvent.changedTouches[0];

    var x = touch.clientX;
    var y = touch.clientY;

    endmove(x,y);
    measureTime();
  });



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
  //
  //
  //   return false;
  //
  // });


  // $(".pad-controls").on("touchend",".button", function(){
  //   var direction = $(this).attr("direction");
  //   $(this).removeClass("active");
  //
  //   socket.emit('releaseDirection', {
  //     direction: direction
  //   });
  // })






});
