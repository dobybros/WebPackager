const path = require('path')
const fs = require('fs')
const conf = require('./build_conf')

module.exports = function() {
  var htmls = []
  var others = []
  function readDir(extraDir) {
    let currentPath = path.join(this.path, extraDir)
    fs.readdirSync(currentPath).forEach((dir) => {
      let awaitingFile = path.join(currentPath, dir)
      if (fs.statSync(awaitingFile).isDirectory()) {
        readDir.bind({path: currentPath})(dir)
      }else if (dir.indexOf('.html') !== -1) {
        htmls.push(path.relative(path.join(__dirname, conf.root), awaitingFile))
      }else {
        others.push(path.relative(path.join(__dirname, conf.root), awaitingFile))
      }
    })
  }
  readDir.bind({path: path.join(__dirname, conf.root)})(conf.templetes)
  this.htmls = htmls
  this.others = others
}