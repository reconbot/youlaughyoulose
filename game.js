/*global CONFIG:true */

var SmileDetector = require('smile_detector')
  , fs = require('fs')
  , _ = require('underscore');


var players = {};

var timeout;
var countDown = 9*1000;
var readycount = 0;

//hook up the functions we want on the socket
var gameOn = function(socket){
  console.log(socket.id + ' joined the game');
  players[socket.id] = socket;
  socket.ready = false;
  socket.on('image', detect);
  socket.on('ready', setReady);
};

var setReady = function(data, fn){
  if(this.ready){ return; }
  readycount ++;
  if(timeout){
    clearTimeout(timeout);
  }
  timeout = setTimeout(startGame, countDown);
  console.log(this.id + ' is ready');
  this.ready = true;
  
  // Let everyone know that someone is ready
  var that = this;
  _.forEach(players, function(player){
    if(player !== that && player.ready){
      player.emit('ready', countDown);
    }
    player.emit('readycount', readycount);
  });
  //send the confirm ready event back
  if(typeof fn === 'function'){fn(countDown);}

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
    readycount = 0;

    _.forEach(players, function(player){
      player.emit('readycount', readycount);
      if(!player.ready){return;}
      player.gameId = gameId;
      player.ready = false;
      player.emit('start', '!');
    });

};

var lose = function(loser, imageDataURL, faces){
  console.log(loser.id + ' lost');
  loser.emit('lose');
  _.forEach(players, function(player){
    if(player !== loser && player.gameId === loser.gameId){
      player.emit('win', imageDataURL, faces);
    }
  });
};

var gameOff = function(socket){
  console.log(socket.id + ' has left the game');
  delete players[socket.id];
  checkReady();
};

var detect = function(imageDataURL, cb){
  var socket = this;
  if (!cb) {
    console.log("got image event with no cb, wtf!");
    return;
  }
  console.log(socket.id + ' Got Image');

  // remove data url header
  var base64PNG = imageDataURL.substring(CONFIG.dataURLHeader.length)
    , buffer = new Buffer(base64PNG, 'base64');

  var tmpImgFilePath = CONFIG.tmpImagesPath + "/ylyl_" + Math.floor(Math.random() * 100000) + ".jpg";

  fs.writeFile(tmpImgFilePath, buffer, function(err) {
    if (err)
      console.log(err);

    SmileDetector.detect(tmpImgFilePath, function(faces) {
      console.log(socket.id + " Found " + faces.length + " faces");
      var lost = false;

      for (var i=0 ; i < faces.length ; i++) {
        var face = faces[i];
        console.log(socket.id + " Face [" + i + "]: smiling? " + face.smile + " / smile intensity: " + face.intensity);
        if (face.smile && face.intensity > CONFIG.smileThreshold) {
          face.loser = true;
          lost = true;
        }
      }
      if (lost){
        lose(socket, imageDataURL, faces);
        cb(true, faces);
      }else{
        cb(false, null);
      }

      fs.unlink(tmpImgFilePath);
    });

  });
};


module.exports = {
  sockets :function(sockets){
    sockets.on('connection', gameOn);
    sockets.on('disconnect', gameOff);
  },
  postBack: function(req, res){

    var resCb = function(smile, faces){
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({smile: smile, faces:faces}));
    };

    if(!req.params.id){
      //fine no events, lets just play along
      var faker = {
          emit: function(){}
        , gameId: 0
        , id: 0
      };
      return detect.call(faker, req.body.data, resCb);
    }

    var socket = players[req.params.id];
    detect.call(socket, req.body.data, resCb);
  }
};
