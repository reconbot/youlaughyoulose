var SmileDetector = require('smile_detector'),
    fs = require('fs'),
    async = require('async'),
    util = require('util'),
    Canvas = require('canvas'),
    Image = Canvas.Image;

var sourceFiles = './portland/';
var outDir = './tmp/';
var smileThreshold = 15; // magic
var maxLineWidth = 40;
var lineWidth = 20;

var detect = function(path, cb){
  console.log('start ' + path);
  SmileDetector.detect(sourceFiles + path, function(faces) {
    console.log(path + " Found " + faces.length + " faces");
    faces.forEach(function(face, index){
      face.loser = false;
      //console.log( path + " Face [" + index + "]: smiling? " +
      //  face.smile + " / smile intensity: " + face.intensity);
      if (face.smile && face.intensity > smileThreshold) {
        face.loser = true;
      }
    });
    var imgInfo = {
      faces: faces,
      path: path
    };
    cb(null, imgInfo);
  });

};


var drawBoxes = function(imgInfo, cb) {
  console.log(imgInfo.path + ' drawing boxes');
  fs.readFile(sourceFiles + imgInfo.path, function(err, imgData){
    var img = new Image();
    img.src = imgData;

    var canvas = new Canvas(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0 );
    imgInfo.faces.forEach(function(face,i){
      //console.log(imgInfo.path + ' drawing face ' + i);

      if (face.loser){
        ctx.strokeStyle = "red";
      }else{
        ctx.strokeStyle = "green";
      }

      ctx.beginPath();

      var center_x = face.x + (face.width/2),
          center_y = face.y + (face.height/2),
          radius = null,
          lineWidth = null;

        if (face.width > face.height) {
          radius = face.width / 2;
          lineWidth = maxLineWidth * (face.width / canvas.width);
        } else {
          radius = face.height / 2;
          lineWidth = maxLineWidth * (face.height / canvas.height);
        }
        ctx.lineWidth = lineWidth;
        ctx.arc(center_x, center_y, radius, 0, Math.PI*2, true);

        if (face.loser) {
          ctx.moveTo(face.x, face.y);
          ctx.lineTo(face.x + face.width, face.y + face.height);
          ctx.moveTo(face.x + face.width, face.y);
          ctx.lineTo(face.x, face.y + face.height);
        }

        ctx.stroke();
    });

    cb(null, imgInfo, canvas);
  });
};

var writeCanvas = function(imgInfo, canvas){
  console.log(imgInfo.path + ' writing canvas');
  var out = fs.createWriteStream(outDir + imgInfo.path);
  var jpg = canvas.createJPEGStream({
    quality: 90
  });
  jpg.pipe(out);
  return;
};

var finished = function(err, results){
  console.log(results);
};

var pictures = fs.readdirSync(sourceFiles);
var processed = fs.readdirSync(outDir);
var count = 0;

async.mapSeries(pictures, function(path, cb){
  if(processed.some(function(v){return path === v;})){
    console.log(path + ' skipping');
    return cb(null, path);
  }
  count ++;
  if(count > 5){
    return cb('err');
  }
  detect(path, function(err,faces){
    drawBoxes(faces, function(err, imgInfo, canvas){
      writeCanvas(imgInfo, canvas);
    });
    cb(null);
  });
}, finished);


