var gulp = require('gulp');
var globby = require('globby');
var path = require('path');
var createStyleguide = require('./partials/createStyleguide.js');
var browsersyncHelper = require('./partials/browsersync.js');
var watchers = require('./partials/watchers.js');
var gulpFunctions = require('./partials/gulp-functions.js');
var projectConfig = require("./../project.config");
var helper = require('./partials/helper-functions.js');
var localConfig = helper.haveLocalConfig();
var browserifyFunctions = require("./partials/browserify-functions.js");

gulp.task('watchAllRelevantFiles', function() {
  projectConfig.gulpthemes.forEach(function themeSpecific(gulptheme, themeindex) {
    watchers.essentialSass(gulptheme);

    watchers.componentSass(gulptheme);

    watchers.componentTwig(gulptheme);

    watchers.componentHTMLTwig(gulptheme);

    watchers.componentJS(gulptheme);

    if(projectConfig.features.image_optimise.enable) {
      watchers.componentImages(gulptheme);
    }

    watchers.themeLibraries(gulptheme);

    watchers.componentLibraries(gulptheme);

    watchers.componentThemePartial(gulptheme);
  });

  browsersyncHelper.init();
});

gulp.task('compiletasks', function() {
  projectConfig.gulpthemes.forEach(function themeSpecific(gulptheme, themeindex) {
    gulpFunctions.cleanUp(gulptheme);

    globby([
      gulptheme.path + 'components/**/*.scss'
    ]).then(function(entries) {
      entries.forEach(
        function whutever(entry, entryindex) {
          gulpFunctions.compileAndMapSassFile(entry, gulptheme, 0);
        }
      );
    })

    if(projectConfig.features.image_optimise.enable) {
      gulpFunctions.compileAllImages([
        gulptheme.path + 'components/**/*.jpg',
        gulptheme.path + 'components/**/*.jpeg',
        gulptheme.path + 'components/**/*.png',
        gulptheme.path + 'components/**/*.gif',
        gulptheme.path + 'components/**/*.svg',
        '!' + gulptheme.path + 'components/**/dist/*.*'
      ]);
    }

    // When using browserify, the proces, starts of differently.
    if(projectConfig.features.browserify.enable) {
      globby([
        gulptheme.path + 'components/**/*.js',
        '!' + gulptheme.path + 'components/**/dist/*.js',
        '!' + gulptheme.path + 'components/**/*.min.js',
        '!' + gulptheme.path + 'components/**/_*.js',
        '!' + gulptheme.path + 'components/**/node_modules/*.js'
      ]).then(function(entries) {
        entries.forEach(function themeSpecific(entry, entryindex) {
          browserifyFunctions.browserifyFile(entry, false);
        });
      })
    }
    else {
      // When not using browserify, just normally compile a js-file.
      gulpFunctions.reSaveAllThemeComponentsJS(gulptheme);
    }

    createStyleguide.createKss(gulptheme);

  });

  return new Promise(function(resolve, reject) {
    resolve();
  });
});

gulp.task('default', gulp.series('compiletasks', 'watchAllRelevantFiles'));

// If you have gulp running on the server, be sure to only run this command to compile everything.
// Also don't forget to put the following 2 lines in your .gitignore:
// web/themes/**/components/**/dist
// and
// web/themes/**/style-guide
gulp.task('compile', gulp.series('compiletasks'));
