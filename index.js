var express = require('express')
  , mustache = require('./mustache')
  , app = express.createServer()
  , socket = require('socket.io')
  , io = socket.listen(app);

var port = (process.argv[2] || 3000)
  , viewPath = process.cwd() + '/views'
  , staticPath = process.cwd() + '/public';


app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(express.responseTime());
  app.use(express.static(staticPath));
});


app.get('/', function(req, res){
  res.send('hello world');
});



app.listen(port);
console.log("Listening on port: " + port);