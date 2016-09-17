var context = new AudioContext();
var url = window.location;
var path = url.pathname;

var sounds = {
  "boom" : {
    buffer : null,
    url : path + "../sounds/boom.wav"
  },
  "eat" : {
    buffer : null,
    url : path + "../sounds/eat.mp3"
  },
  "bonk" : {
    buffer : null,
    url : path + "../sounds/bonk.mp3"
  }
};

for(var key in sounds) {
  loadSound(key);
}

function loadSound(name){
  var url = sounds[name].url;
  var buffer = sounds[name].buffer;

  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(newBuffer) {
      sounds[name].buffer = newBuffer;
    });
  }
  request.send();
}

function playSound(name){
  // return;
  var buffer = sounds[name].buffer;
  if(buffer){
    var source = context.createBufferSource(); // creates a sound source
    source.buffer = buffer;                    // tell the source which sound to play
    source.connect(context.destination);       // connect the source to the context's destination (the speakers)
    source.start(0);
  }
}