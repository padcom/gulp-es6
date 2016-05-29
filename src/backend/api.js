var api = require('express')();
var server = require('http').createServer(api);

api.get('/api/data', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ message: 'Hello, world!' }) + "\n");
});

module.exports = server;
