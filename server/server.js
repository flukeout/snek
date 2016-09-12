var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname,'..','client')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});

var snakeids = [];

// A player joins the game
io.on('connection', function(socket) {

  // welcome user, send them their snake color (may be user-changeble later)
  console.log('a user connected');  
  socket.emit('welcome', {
    color: "red"
  });

  /*
    Client-generated events
  */

  // a client disconnects
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  // record a snake's movement
  socket.on('direction', function(data){
  	console.log("directional change: ", JSON.stringify(data));;
    io.emit('direction', {
      id: data.id,
      direction: data.direction
    });
  });

  // client requests a new snake
  socket.on('make-snake', function() {
  	console.log("new snake request");
  	var id = snakeids.length;
  	snakeids[id] = socket;
  	var data = {
      id: id,
      x: (Math.random() * 40)  | 0,
      y: (Math.random() * 40)  | 0,
      lenght: 3
    };
  	console.log("new snake request", JSON.stringify(data));
    io.emit('spawn-snake', data);
  });

  /*
    Server-generated events

    'kill-snake': id
    'disconnect-snake': id
  */
});


// boring old server
http.listen(3000, function(){
  console.log('listening on *:3000');
});
