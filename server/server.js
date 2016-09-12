var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var colors = require('../client/colors');
var nextColor = (function() {
  var c = 0;
  return function() {
    return colors[c++ % colors.length];
  };
}());

var uuid = (function() {
  var uid = 0;
  return function() {
    return ++uid;
  };
}());

var players = {};

app.use(express.static(path.join(__dirname,'..','client')));
app.use("/view", express.static(path.join(__dirname,'..','view')));
app.use("/pad", express.static(path.join(__dirname,'..','pad')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});

// A player joins the game
io.on('connection', function(socket) {

  var player = {
    id: uuid(),
    socket: socket,
    color: nextColor()
  };

  players[player.id] = player

  // welcome user, send them their snake color (may be user-changeble later)
  console.log('a user connected, giving it snake id', player.id);

  // send in response to connecting:
  socket.emit('gameSetup', {
    width: 40,
    height: 28,
    id: player.id,
    color: player.color
  });

  // inform everyone a new player joined
  io.emit('playerJoin', {
    id: player.id,
    color: player.color
  });

  // a client disconnects - we don't do much with that yet
  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('playerDisconnect', {
      id: player.id
    })
  });

  // client requests a new snake, server spawns a new snake
  socket.on('makeSnake', function() {
    console.log("making a snake for player with id", player.id);
  	var data = {
      id: player.id,
      x: (Math.random() * 40)  | 0,
      y: (Math.random() * 28)  | 0,
      length: 10,
      color: player.color
    };
  	console.log("new snake request", JSON.stringify(data));
    io.emit('spawnSnake', data);
  });


  // client sends direction input to server, server broadcasts the player's move
  socket.on('direction', function(data){
    data = {
      id: player.id,
      direction: data.direction
    }
    console.log("directional change: ", JSON.stringify(data));;
    io.emit('direction', data);
  });


  // client snake died... broadcast to all connected clients
  socket.on('died', function() {
    io.emit('killSnake', {
      id: player.id
    });
  });
});


// boring old server
http.listen(3000, function(){
  console.log('listening on *:3000');
});
