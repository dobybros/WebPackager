const gulp = require('gulp')
const domSrc = require('gulp-dom-src')
const concat = require('gulp-concat')
const cheerio = require('gulp-cheerio');
const conf = require('./build_conf')
const hr = require('./html_reader')
const htmlReader = new hr()
const glupEach = require('gulp-each')
const path = require('path')
const chalk = require('chalk')
const del = require('del')
const uglify = require('gulp-uglify-es').default;


const htmls = htmlReader.htmls
const copied = htmlReader.others

const yellowConsole = str => {
  console.log(chalk.yellow(str))
}
const redConsole = str => {
  console.log(chalk.red(str))
}
const greenConsole = str => {
  console.log(chalk.green(str))
}

let distPath = path.join(__dirname, conf.target)
yellowConsole(`Removing ${distPath}`)
del(distPath, {force: true}).then(() => {
  greenConsole(`Removed ${distPath} !!!`)
  main()
}).catch(error => {
  throw error
})

let compressedJs = []
htmls.forEach((htmlPath) => {
// let htmlPath = htmls[1]
  let fileName = path.basename(htmlPath, '.html')
  const replacedStr = "$-_-$"
  gulp.task(htmlPath, function() {
    let dest = path.join(conf.target, path.dirname(htmlPath))
    // Bundle js
    try {
      yellowConsole(`Compressing ${fileName}_min.js from ${htmlPath} ...`)
      domSrc({
        file: path.join(conf.root, htmlPath),
        selector: 'script',
        attribute: 'src',
        cwd: path.join(__dirname, conf.root)
      })
        .pipe(concat(`${fileName}_min.js`))
        .pipe(uglify())
        .on('error', function (err) { redConsole(err) })
        .pipe(gulp.dest(dest))
      // Replace bundled js into html.
      yellowConsole(`Generating ${path.basename(htmlPath)} to ${dest}`)
      gulp.src(path.join(conf.root, htmlPath))
        .pipe(glupEach(function(content, _, generate) {
          // Avoid error course of template grammar with replace to $replacedStr
          let regexp = /<%.*?%>/g
          this.replacedHold = content.match(regexp)
          generate(null, content.replace(regexp, replacedStr))
        }))
        .pipe(cheerio(function($, file) {
          let jsPath = `/${path.relative(conf.root, file.base)}/${fileName}_min.js`
          let scripts = $('script[src]')
          scripts.last().after(`<script src="${jsPath}"></script>`)
          scripts.remove()
          // let styles = $('link[href]')
          // styles.remove()
        }))
        .pipe(glupEach(function(content, _, generate) {
          // Restore replaced string.
          let newContent = content
          if (this.replacedHold) {
            this.replacedHold.forEach(function(hold) {
              newContent = newContent.replace(replacedStr, hold)
            })
          }
          generate(null, newContent)
        }))
        .pipe(gulp.dest(dest))
    } catch (e) {
      redConsole(`${e.message} when handle ${htmlPath}`)
      redConsole(`Coping ${htmlPath} into ${dest} ...`)
      gulp.src(path.join(conf.root, htmlPath))
        .pipe(gulp.dest(dest))
    }
  })
})

copied.forEach((copiedPath) => {
    gulp.task(copiedPath, function() {
      let dest = path.join(conf.target, path.dirname(copiedPath))
      yellowConsole(`Coping ${copiedPath} into ${dest} ...`)
      gulp.src(path.join(conf.root, copiedPath))
        .pipe(gulp.dest(dest))
    })
  }
)

// copy all static
gulp.task('copyStatic', function() {
  let dest = path.join(conf.target, conf.static)
  gulp.src(path.join(conf.root, conf.static) + '**/*')
    .pipe(gulp.dest(dest))
})

function main() {
  gulp.start(Object.keys(gulp.tasks))
  greenConsole("Finishing ...")
}
