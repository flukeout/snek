function handleKeyDown(event, resultTracker) {

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

    // letter key handling

    // Warp
    case keys.w:
    case keys.W:
      resultTracker.warp = true;
      break;

    // Change name
    case keys.n:
    case keys.N:
      chat.changeNameKeyHit();
      break;

    // Bomb Key
    case keys.b:
    case keys.B:
      resultTracker.bomb = true;
      break;

    // arrow key handling
    case 37:
      resultTracker.direction = "left";
      break;
    case 39:
      resultTracker.direction = "right";
      break;
    case 38:
      resultTracker.direction = "up";
      break;
    case 40:
      resultTracker.direction = "down";
      break;

    // the 'enter' key
    case 13:
      chat.enterHit();
      break;

    default:
      resultTracker.direction = false;
      resultTracker.bomb = false;
      resultTracker.warp = false;
  }
}
