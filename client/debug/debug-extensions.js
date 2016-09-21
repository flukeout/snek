var _oldfn = handleKeyDown;
handleKeyDown = function(event, resultTracker) {
  _oldfn(event, resultTracker);

  var keys = {};

  // numbers
  for (var start=48, end=57, i=start, key; i<=end; i++) {
    key = String.fromCharCode(i);
    keys[key] = i;
  }

  // letters
  for (var start=65, end=90, i=start, key; i<=end; i++) {
    key = String.fromCharCode(i);
    keys[key] = i;
    key = String.fromCharCode(i+32);
    keys[key] = i+32;
  }

  switch(event.keyCode) {
    case keys['1']:
      console.log("generating full-length debug snake");
      socket.emit("generateDebugSnake","fullsnake");
      break;

    case keys['2']:
      console.log("generating debug snake");
      socket.emit("generateDebugSnake");
      break;

    case keys['3']:
      console.log("generating a head-on collision");
      socket.emit("generateDebugSnake", "collisionsnake");
      break
  }
};

