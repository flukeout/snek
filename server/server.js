var express = require('express');
var app = express();
require('./sockets')(app);

var path = require('path');

app.use(express.static(path.join(__dirname,'..','client')));
app.use("/pad", express.static(path.join(__dirname,'..','pad')));
app.use("/sounds", express.static(path.join(__dirname,'..','sounds')));

app.get('/socket.io.js', function(req, res) {
  res.sendFile('socket.io.js', {
  	root: path.join(__dirname, '..', 'node_modules', 'socket.io-client')
  });
});
