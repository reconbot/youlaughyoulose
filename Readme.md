You Laugh, You Lose
====================

Requirements:
  + OpenCV 2.3.1a (for Haar feature detection)
  + *Dev Channel* release of Chrome (or recent Opera). 
  + Chrome Canary is the latest dev and wont mess with your usual chrome install.
  [https://tools.google.com/dlpage/chromesxs](https://tools.google.com/dlpage/chromesxs)


To Run:
  1. (install OpenCV 2.3.1a)
    On OS X, via homebrew: `brew install https://raw.github.com/mxcl/homebrew/071c3eb/Library/Formula/opencv.rb`
  2. `git submodule init && git submodule update`
  3. `cd smile_detector && node-waf configure build`
  4. `node index.js`

Possible Speedup:
  + Use ramdisk as tmp img store (under OS X): `diskutil erasevolume HFS+ "ramdisk" `hdiutil attach -nomount ram://1165430``
