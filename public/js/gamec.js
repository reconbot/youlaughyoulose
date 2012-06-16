/*global APP:true, Backbone:true, $:true, _:true */

APP.Game = Backbone.View.extend({

  initialize: function(opt){
    this.socket = opt.socket;
    this.camera = opt.camera;

    this.playing = false;

    this.maxLineWidth = 10;

    this.loseAudioElement = document.createElement('audio');
    this.loseAudioElement.setAttribute('src', '/sounds/buzzer.mp3');
    this.loseAudioElement.load();

    this.winAudioElement = document.createElement('audio');
    this.winAudioElement.setAttribute('src', '/sounds/bell.mp3');
    this.winAudioElement.load();

    _.bindAll(this, 'onFaceResult', 'start', 'stop', 'snapshot', 'win');

    this.socket.on('start', this.start);
    this.socket.on('stop', this.stop);
    this.socket.on('win', this.win);

  },

  ready: function(){
    this.socket.emit('ready', 'you know it!');
  },

  start: function(){
    this.playing = true;
    this.snapshot();
  },

  stop: function(){
    this.playing = false;
  },

  snapshot: function(){
    var data = this.camera.snapshot();
    console.log('sending your mug to our pug');
    this.socket.emit('image',data, this.onFaceResult);
  },

  onFaceResult: function(isSmiling, faces){
    console.log(faces);
    if(isSmiling){
      return this.lose(faces);
    }

    if(this.playing){
      window.setTimeout(this.snapshot, 1);
    }
  },

  win: function(){
    console.log('you won!');
    this.winAudioElement.play();
  },

  lose: function(face){
    this.loseAudioElement.play();
    this.drawBoxes(face);
    window.alert('haha you lose');
    console.log('you lost');
    $('#game').append(this.camera.canvas);
  },

  drawBoxes: function(faces) {
    var camera = this.camera;
    camera.ctx.lineWidth = 6;

    for (var i=0 ; i < faces.length ; i++) {
      var face = faces[i];

      if (face.loser)
        camera.ctx.strokeStyle = "red";
      else
        camera.ctx.strokeStyle = "green";


      camera.ctx.beginPath();

      var center_x = face.x + (face.width/2)
        , center_y = face.y + (face.height/2)
        , radius = null
        , lineWidth = null

      if (face.width > face.height) {
        radius = face.width / 2;
        lineWidth = this.maxLineWidth * (face.width / camera.canvas.width)
      } else {
        radius = face.height / 2;
        lineWidth = this.maxLineWidth * (face.height / camera.canvas.height)
      }

      camera.ctx.lineWidth = lineWidth;

      camera.ctx.arc(center_x, center_y, radius, 0, Math.PI*2, true);

      if (face.loser) {
        camera.ctx.moveTo(face.x, face.y);
        camera.ctx.lineTo(face.x + face.width, face.y + face.height);
        camera.ctx.moveTo(face.x + face.width, face.y);
        camera.ctx.lineTo(face.x, face.y + face.height);
      }

      camera.ctx.stroke();
    }
  }

});



APP.Camera = function(opt){
  opt = opt || {};

  var x = opt.x || 640;
  var y = opt.y || 480;

  //use a real thing or make a document fragment
  this.canvas = opt.canvas || $('<canvas width="' + x +'" height="'+y+'"></canvas>').get(0);
  this.video = opt.video || $('<video autoplay></video>').get(0);
  this.ctx = this.canvas.getContext('2d');

  // stupid w3c vendor prefix garbage
  navigator.getUserMedia =  navigator.getUserMedia ||
                      navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia ||
                      navigator.msGetUserMedia;

  if(!navigator.getUserMedia){
    this.initFlash();
  }else{
    this.initHTML5();
  }

};

APP.Camera.prototype.initHTML5 = function(){
  var that = this;
  navigator.getUserMedia({video: true}, function(stream) {
    if (navigator.webkitGetUserMedia){
      that.video.src = window.webkitURL.createObjectURL(stream);
    }else{
      that.video.src = stream; // Opera
    }
  }, this.noCamera);
};

APP.Camera.prototype.initFlash = function(){
  throw Error('Flash Fallback Missing and no getUserMedia!');
};

APP.Camera.prototype.noCamera = function(e) {
  console.log('Failed to acquire camera!', e);
  window.alert('no camera!');
};

APP.Camera.prototype.snapshot = function() {
  this.ctx.drawImage(this.video, 0, 0);
  return this.canvas.toDataURL('image/png');
};

