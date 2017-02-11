You Laugh, You Lose
====================

[![Greenkeeper badge](https://badges.greenkeeper.io/reconbot/youlaughyoulose.svg)](https://greenkeeper.io/)

Requirements:
  + OpenCV 2.3.1a (for Haar feature detection)
  + *Dev Channel* release of Chrome (or recent Opera). 
  + Chrome Canary is the latest dev and wont mess with your usual chrome install.
  [https://tools.google.com/dlpage/chromesxs](https://tools.google.com/dlpage/chromesxs)


To Run:
  1. (install OpenCV 2.3.1a)
    On OS X, via homebrew: `brew install https://raw.github.com/mxcl/homebrew/071c3eb/Library/Formula/opencv.rb`
  2. `git submodule init && git submodule update`
  3. npm install
  4. `node index.js 3000`
  5. Open [http://0.0.0.0:3000](http://0.0.0.0:3000) in Chrome.
  6. Turn your screen brightness up, try to make your face fill most of the camera area and make sure you're not backlit. The smile detector wont really work otherwise.

Possible Speedup:
  + Use ramdisk as tmp img store (under OS X): ```
diskutil erasevolume HFS+ "ramdisk" `hdiutil attach -nomount ram://1165430`
```
