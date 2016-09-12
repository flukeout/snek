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

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  // pass-through for now
  socket.on('direction', function(data){
  	console.log("directional change: ", JSON.stringify(data));;
    io.emit('direction', data);
  });
});


// boring old server
http.listen(3000, function(){
  console.log('listening on *:3000');
});
