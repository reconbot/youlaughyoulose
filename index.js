var express = require('express')
  , mustache = require('./mustache')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , path = require('path')
  , game = require('./game');

//
// Setup ------------------------------------------------------------------------
//

var port = (process.argv[2] || 3000)
  , viewPath = process.cwd() + '/views'
  , staticPath = process.cwd() + '/public';

var tmpImagesPath = './tmp'
  , ramdiskPath = '/Volumes/ramdisk' // see readme for ramdisk info under OS X
  , picsDirPath = '/img/funny_pics';

// IO setup https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
io.set('log level', 1); //0 - error, 1 - warn, 2 - info, 3 - debug
//io.set('heartbeat timeout', 15); //default 60
//io.set('heartbeat interval', 10);
//io.set('close timeout', 10);

CONFIG = {
  dataURLHeader: 'data:image/png;base64,',
  smileThreshold: 15
};


//
// If a ramdisk (under OS X) is mounted, attempt to use it
// otherwise create a tmp dir in the project directory
//
if (path.existsSync(ramdiskPath)) {
  console.log("Ramdisk path exists, using it as tmp dir.");
  tmpImagesPath = ramdiskPath;
} else {
  if (!path.existsSync(tmpImagesPath)) {
    fs.mkdirSync(tmpImagesPath);
    console.log("Created tmp dir: " + tmpImagesPath);
  }
}
CONFIG.tmpImagesPath = tmpImagesPath;
console.log("tmp dir: " + tmpImagesPath);

var allPicturePaths = fs.readdirSync(staticPath + picsDirPath);


app.configure(function(){
  app.use(express.bodyParser());
  //app.use(express.logger());
  app.use(express.responseTime());
  app.use(express.static(staticPath));
  app.register('.mustache', mustache);
  app.set('view engine', 'mustache');

  app.use(express.errorHandler({
    dumpExceptions:true,
    showStack:true
  }));

});


//
// Routes -----------------------------------------------------------------------
//

app.get('/', function(req, res){
  res.render('index');
});

//magic happens here
game(io.sockets);

io.sockets.on('connection', function (socket) {
  socket.send('Hello Programs!');
});


app.get('/randompic', function(req, res){
  var randomPic = allPicturePaths[ Math.floor(Math.random() * allPicturePaths.length) ];
  res.send(picsDirPath + '/' + randomPic);
});


app.listen(port);
console.log("Listening on port: " + port);
console.log("http://localhost:" + port);
