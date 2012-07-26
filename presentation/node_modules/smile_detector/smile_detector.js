
var Face = require('./build/Release/face.node')
  , recognizer = new Face.init()

var SmileDetector = {
  detect: function (imagePath, callback) {
    recognizer.img = imagePath
    recognizer.pathto = __dirname + '/cascades/'

    recognizer.checkSmile = true
    recognizer.minsize = 20

    recognizer.oncomplete = callback

    recognizer.run()
  }
}

module.exports = SmileDetector
