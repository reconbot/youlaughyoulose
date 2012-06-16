var express = require('express')
  , mustache = require('./mustache')
  , app = express.createServer()
  , socket = require('socket.io')
  , io = socket.listen(app)
  , fs = require('fs')
  , path = require('path')
  , SmileDetector = require('./smile_detector/build/Release/face.node')

var port = (process.argv[2] || 3000)
  , viewPath = process.cwd() + '/views'
  , tmpImagesPath = './tmp'
  , ramdiskPath = '/Volumes/ramdisk' // see readme for ramdisk info under OS X
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

console.log("tmp dir: " + tmpImagesPath);

app.listen(port);
console.log("Listening on port: " + port);
