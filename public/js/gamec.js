/*global APP:true, Backbone:true, $:true, _:true */

APP.Game = Backbone.View.extend({

  events: {
    'click .js-ready': 'ready'
  },

  initialize: function(opt){
    this.socket = opt.socket;
    this.camera = opt.camera;
    this.pictureURLs = opt.pictureURLs;
    this.pictureIntervalId = null;

    this.playing = false;
    this.maxLineWidth = 10;


    this.render();

    _.bindAll(this, 'onFaceResult', 'start', 'stop', 'snapshot', 'win', 'showRandomImage', 'startCountDown');

    this.socket.on('start', this.start);
    this.socket.on('stop', this.stop);
    this.socket.on('win', this.win);
    this.socket.on('ready', this.startCountDown);
  },

  render: function(){
    this.loseAudioElement = document.createElement('audio');
    this.loseAudioElement.setAttribute('src', '/sounds/buzzer.mp3');
    this.loseAudioElement.load();

    this.winAudioElement = document.createElement('audio');
    this.winAudioElement.setAttribute('src', '/sounds/bell.mp3');
    this.winAudioElement.load();

    // preload funny images
    for (var i=0 ; i < this.pictureURLs.length ; i++){
      $('<img src ="' + this.pictureURLs[i] + '"/>');
    }

  },

  ready: function(){
    this.showVideo();
    this.socket.emit('ready', 'you know it!', this.startCountDown);
  },

  startCountDown: function(countDown){
    if(this.countdown){
      clearInterval(this.countdown);
    }
    var seconds = Math.floor(countDown/1000);
    var that = this;
    this.countDown = setInterval(function(){
      that.showCountDown(seconds);
      seconds -= 1;
      if(!seconds){
        clearInterval(that.countDown);
      }
    }, 1000);
    //start and reset countdown
    console.log(countDown);
  },

  start: function(){
    this.playing = true;
    this.showPictures();
    this.startCyclingImages();
    this.snapshot();
  },

  stop: function(){
    this.playing = false;
  },

  startCyclingImages: function() {
    this.showRandomImage();

    this.pictureIntervalId = setInterval(this.showRandomImage, 5*1000);
  },

  stopCyclingImages: function() {
    clearInterval(this.pictureIntervalId);
  },

  showRandomImage: function() {
    var randomPic = this.pictureURLs[ Math.floor(Math.random() * this.pictureURLs.length) ];
    $('.js-funny-image').attr('src', randomPic);
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

  win: function(imageDataURL, faces){
    console.log('you won!');
    this.winAudioElement.play();
    this.stopCyclingImages();
    this.stop();

    var that = this;
    this.loadImageIntoCanvas(imageDataURL, function() {
      that.drawBoxes(faces);
      that.showCanvas();
    });
  },

  lose: function(faces){
    console.log('you lost');
    this.loseAudioElement.play();
    this.stopCyclingImages();
    this.stop();
    this.drawBoxes(faces);
    this.showCanvas();
  },

  showVideo: function(){
    this.$('.viewport').children().addClass('hide');
    this.$('.js-video').removeClass('hide');
  },

  showCanvas: function(){
    this.$('.viewport').children().addClass('hide');
    this.$('.js-canvas').removeClass('hide');
  },

  showPictures: function(){
    this.$('.viewport').children().addClass('hide');
    this.$('.js-funny-image').removeClass('hide');
  },

  showCountDown: function(text){
    //don't hide shit
    var fontSize = 200;
    console.log(text);
    var el = this.$('.js-countdown').removeClass('hide').get(0);
    var ctx = el.getContext('2d');
    ctx.font = fontSize + "pt Arial"
    ctx.fillStyle = "red";
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.fillText(text, el.width/2 - fontSize/4, (el.height + fontSize)/2);
  },

  loadImageIntoCanvas: function(imageDataURL, callback) {
    var img = new Image;
    var that = this;
    img.onload = function() {
      that.camera.ctx.drawImage(img, 0, 0);
      callback()
    }
    img.src = imageDataURL;
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
        , lineWidth = null;

      if (face.width > face.height) {
        radius = face.width / 2;
        lineWidth = this.maxLineWidth * (face.width / camera.canvas.width);
      } else {
        radius = face.height / 2;
        lineWidth = this.maxLineWidth * (face.height / camera.canvas.height);
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
  this.ready = false;
  // stupid w3c vendor prefix garbage
  navigator.getUserMedia = navigator.getUserMedia ||
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
    that.ready = true;
  }, this.noCamera);
};

APP.Camera.prototype.initFlash = function(){
  window.alert('Lets play with Chrome Canary!');
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

