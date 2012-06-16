/*global APP:true, Backbone:true, $:true, _:true */

APP.Game = Backbone.View.extend({

  initialize: function(opt){
    this.socket = opt.socket;
    this.camera = opt.camera;

    this.playing = false;

    _.bindAll(this, 'onFaceResult', 'start', 'stop', 'snapshot');

    this.socket.on('start', this.start);
    this.socket.on('stop', this.stop);

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

  onFaceResult: function(smile){
    if(smile){
      return this.lose();
    }

    if(this.playing){
      window.setTimeout(this.snapshot, 10);
    }
  },

  lose: function(){
    window.alert('haha you lose');
    this.drawRedX();
    $($('#game')[0]).append(camera.canvas)
  },

  drawRedX: function() {
    camera.ctx.lineWidth = 3;
    camera.ctx.strokeStyle = "red";

    camera.ctx.beginPath();

    camera.ctx.moveTo(0, 0);
    camera.ctx.lineTo(camera.canvas.width, camera.canvas.height);
    camera.ctx.stroke();

    camera.ctx.moveTo(camera.canvas.width, 0);
    camera.ctx.lineTo(0, camera.canvas.height);
    camera.ctx.stroke();
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

