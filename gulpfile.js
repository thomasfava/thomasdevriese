'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');
var plumber = require('gulp-plumber');
var autoprefix = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var browserSync = require('browser-sync').create();
var fs = require('fs');

// The default config is loaded by the following line. This file would be used
// when there's no gulp config local available.
var config = require('./gulpfile.config.js');

// The following code checks if there's a 'gulpfile.config.local.js' available
// if not the default config would be used.
// Otherwise the 'gulpfile.config.local.js' will be loaded, you can adjust this
// file with the preferred settings.
if (fs.existsSync(__dirname + '/./gulpfile.config.local.js')) {
  config = require('./gulpfile.config.local.js');
}

var reportError = function (error) {
  var report = '';
  report += 'TASK:' + ' [' + error.plugin + ']\n';
  report += 'PROB:' + ' ' + error.message + '\n';
  if (error.lineNumber) { report += 'LINE:' + ' ' + error.lineNumber + '\n'; }
  if (error.fileName)   { report += 'FILE:' + ' ' + error.fileName + '\n'; }
  console.error(report);

  // PREVENT THE 'WATCH' TASK FROM STOPPING
  this.emit('end');
};

gulp.task('browserCheck', function() {
  browserSync.init({
    proxy: config.browserSync.proxy,
    open: config.browserSync.open,
    browser: config.browserSync.browser
  });
});

gulp.task('sass', function() {
  return gulp.src(config.baseDir + 'sass/**/*.scss')
    .pipe(plumber({
      errorHandler: reportError
    }))
    // Sass Globbin does not support sourcemaps so it can not be between
    // sourcemaps' .init en .write. It also makes sense to put it right after
    // the src read for gulp, with the exception of plumber because we would
    // like to catch errors from sassGlob as well.
    .pipe(sassGlob())
    // Anything you put betweend sourcempas' .init and .write needs to support
    // sourcemaps to have a correct output of the maps!
    // @see: https://github.com/floridoo/gulp-sourcemaps/wiki/Plugins-with-gulp-sourcemaps-support
    .pipe(sourcemaps.init())
    .pipe(sass({
      // Output styles: 'nested', 'compact', 'expanded' or 'compressed'
      outputStyle: 'compressed',
      // "includePaths" is needed so LibSass (which gulp-sass actually wraps
      // around) can find it's dependencies.
      includePaths: ['node_modules']
    }))
    .pipe(autoprefix('last 3 versions', '> 1%'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.baseDir + 'css/'))
    // Put browsersync right after css has been written. This will update your
    // connected browsers asap.
    // Limit the scope for the streaming to css files only. If you do not limit
    // browsersync will also pickup the map files and trigger a full reload.
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('images', function() {
  return gulp.src(config.baseDir + 'images/original/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevels: 3
    }))
    .pipe(gulp.dest(config.baseDir + 'images'));
});

gulp.task('watch', ['sass'], function() {
  if (config.browserSync.enabled) {
    browserSync.init({
      proxy: config.browserSync.proxy,
      open: config.browserSync.open,
      browser: config.browserSync.browser
    });
  }

  gulp.watch(config.baseDir + 'sass/**/*', ['sass']);
  // Do a full reload of browsersync when Javascript changes or when templates
  // change. We should not stream these.
  gulp.watch(config.baseDir + 'js/**/*').on('change', browserSync.reload);
  gulp.watch(config.baseDir + 'templates/**/*').on('change', browserSync.reload);
});

gulp.task('default', ['watch']);
