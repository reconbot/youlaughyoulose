var SmileDetector = require('./smile_detector/smile_detector')
  , fs = require('fs')
  , _ = require('underscore')
  , CONFIG = global.CONFIG;

var players = {};

//hook up the functions we want on the socket
var gameOn = function(socket){
  players[socket.id] = socket;
  socket.on('image', detect);
  console.log(socket);
};

var gameOff = function(socket){
  delete players[socket.id];
};

var detect = function(data, cb){
    if (!cb) {
      console.log("got image event with no cb, wtf!");
      return;
    }

    // remove data url header
    var base64PNG = data.substring(CONFIG.dataURLHeader.length)
      , buffer = new Buffer(base64PNG, 'base64');

    var tmpImgFilePath = CONFIG.tmpImagesPath + "/ylyl_" + Math.floor(Math.random() * 100000) + ".png";

    fs.writeFile(tmpImgFilePath, buffer, function(err) {
      if (err)
        console.log(err);

      SmileDetector.detect(tmpImgFilePath, function(faces) {
        console.log("Found " + faces.length + " faces");
        for (var i=0 ; i < faces.length ; i++) {
          var face = faces[i];
          console.log(face);
          console.log("Face [" + i + "]: smiling? " + face.smile + " / smile intensity: ");
          if (face.smile && face.intensity > CONFIG.smileThreshold) {
            cb(true);
            return;
          }
        }
        cb(false);
        fs.unlink(tmpImgFilePath);
      });

    });
  };


module.exports = function(sockets){
  sockets.on('connection', gameOn);
  sockets.on('disconnect', gameOff);
};