/*global CONFIG:true */

var SmileDetector = require('./smile_detector/smile_detector')
  , fs = require('fs')
  , _ = require('underscore');


var players = {};

var timeout;

//hook up the functions we want on the socket
var gameOn = function(socket){
  console.log(socket.id + ' joined the game');
  players[socket.id] = socket;
  socket.ready = false;
  socket.on('image', detect);
  socket.on('ready', setReady);
};

var setReady = function(){
  if(timeout){
    clearTimeout(timeout);
  }
  timeout = setTimeout(startGame, 10000);
  console.log(this.id + ' is ready');
  this.ready = true;
  checkReady();
};

var checkReady = function(){
  var weReady = _.all(players, function(playa){
    return playa.ready;
  });
  if(weReady){
    startGame();
  }
};

var startGame = function(){
    var gameId = new Date().getTime();
    _.forEach(players, function(playa){
      if(!playa.ready){return;}
      playa.gameId = gameId;
      playa.ready = false;
      playa.emit('start', '!');
    });
};

var lose = function(loser){
  console.log(loser.id + ' lost');
  loser.emit('lose');
  _.forEach(players, function(player){
    if(player !== loser && player.gameId === loser.gameId){
      player.emit('win', '!');
    }
  });
};

var gameOff = function(socket){
  console.log(socket.id + ' has left the game');
  delete players[socket.id];
  checkReady();
};

var detect = function(data, cb){
  var socket = this;
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
      var lost = false;

      for (var i=0 ; i < faces.length ; i++) {
        var face = faces[i];
        console.log(face);
        console.log("Face [" + i + "]: smiling? " + face.smile + " / smile intensity: ");
        if (face.smile && face.intensity > CONFIG.smileThreshold) {
          face.loser = true;
          lost = true;
        }
      }

      if (lost){
        lose(socket);
        cb(true, faces);
      }else{
        cb(false, null);
      }

      fs.unlink(tmpImgFilePath);
    });

  });
};


module.exports = function(sockets){
  sockets.on('connection', gameOn);
  sockets.on('disconnect', gameOff);
};
