var SmileDetector = require('./smile_detector/build/Release/face.node')
  , fs = require('fs');


//hook up the functions we want on the socket
var game = module.exports = function(socket){
  socket.on('image', function(data, cb){
    // remove data url header
    var base64PNG = data.substring(CONFIG.dataURLHeader.length)
      , buffer = new Buffer(base64PNG, 'base64');

    var tmpImgFilePath = CONFIG.tmpImagesPath + "/ylyl_" + Math.floor(Math.random() * 100000) + ".png";

    fs.writeFile(tmpImgFilePath, buffer, function(err) {
      if (err)
        console.log(err);

      cb(true);
    });
  });
};

