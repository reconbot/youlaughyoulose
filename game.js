var SmileDetector = require('./smile_detector/build/Release/face.node');


//hook up the functions we want on the socket
var game = module.exports = function(socket){
  socket.on('image', function(data, cb){
    //process data
    console.log(data);
    cb(true);
  });
};

