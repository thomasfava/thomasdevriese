var gulp = require('gulp');
var browserify = require("browserify");
var helper = require("./helper-functions.js");
var shell = require('gulp-shell');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babelify = require("babelify");
var browsersyncHelper = require('./browsersync.js');
var gulpif = require('gulp-if');
var commonShake = require('tinyify');
var projectConfig = require("../../project.config");
var localConfig = helper.haveLocalConfig();

module.exports = {
  browserifyFile: function(path, reload) {
    var destination = helper.getSiblingDistFolder(path);
    var filename = helper.getLastParts(path, 1);

    var browserified_file = browserify(path, {
      debug: projectConfig.features.browserify.debug_mode
    });

    if(projectConfig.features.browserify.tinyify.enable) {
      browserified_file.plugin('tinyify', projectConfig.features.browserify.tinyify.options);
    }

    browserified_file
      .transform("babelify", {presets: ["@babel/env"]})
      .bundle()
        .on('error', function (err) {
          if(localConfig.notifications.javascript.browserify_errors) {
            helper.handleError(err, filename, 'js', 'loud');
          } else {
            helper.handleError(err, filename, 'js', 'silent');
          }
        }
      )
      .pipe(source(filename)) // gives streaming vinyl file object
      .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
      .pipe(gulpif(projectConfig.features.browserify.debug_mode, sourcemaps.init()))
      .pipe(gulpif(projectConfig.features.uglify.enable,
        uglify(projectConfig.features.uglify.options)
        .on('error', function (err) {
          if(localConfig.notifications.javascript.uglify_errors) {
            helper.handleError(err, filename, 'js', 'loud');
          } else {
            helper.handleError(err, filename, 'js', 'silent');
          }
        })
      ))
      .pipe(gulpif(projectConfig.features.browserify.debug_mode, sourcemaps.write('/maps')))
      .pipe(gulp.dest(destination))
      .pipe(shell([
        'echo "JS:  Compiled ' + path + '"'
      ]))
      .on('end', function() {
        if (reload) {
          browsersyncHelper.reload();
        }
      });
  }
}
