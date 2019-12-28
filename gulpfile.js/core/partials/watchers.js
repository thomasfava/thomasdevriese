var gulp = require('gulp');
var gulpFunctions = require('./gulp-functions.js');
var helper = require('./helper-functions.js');
var createStyleguide = require('./createStyleguide.js');
var browsersyncHelper = require('./browsersync.js');
var watch = require('gulp-watch');
var path = require('path');
var del = require('del');
var localConfig = helper.haveLocalConfig();

module.exports = {
  essentialSass: function(gulptheme) {
    gulp.watch([
      gulptheme.path + '_sass-essentials/*.scss'
    ])
      .on("change", function(path, stats) {
        gulpFunctions.reSaveAllThemeComponentsSCSS(gulptheme.path);
      })
      .on("add", function(path, stats) {
        gulpFunctions.reSaveAllThemeComponentsSCSS(gulptheme.path);
      });
  },
  componentSass: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.scss'
    ])
      .on("change", function(path, stats) {
        var filename = helper.getLastParts(path, 1);
        var directorysAroundComponents = path.split('components/');
        var directoryAfter = directorysAroundComponents[1].split( '/' ).slice( 0, 1 );

        /*
         * If we save a partial,
         * we should generate the all the scss files that don't have an underscore form that component.
         */
        if(filename.startsWith("_")) {
          gulpFunctions.reSaveAllComponentSCSS(gulptheme.path + 'components/' + directoryAfter);
        } else {
          gulpFunctions.compileAndMapSassFile(path, gulptheme, true);
        }
      })
      .on("add", function(path, stats) {
        var filename = helper.getLastParts(path, 1);

        if(filename.startsWith("_")) {
          // do nothing when adding a partial scss.
        } else {
          gulpFunctions.compileAndMapSassFile(path, gulptheme, true);
          createStyleguide.createKss(gulptheme);
        }
      })
      .on("unlink", function(path, stats) {
        var filename = helper.getLastParts(path, 1);

        if(filename.startsWith("_")) {
          // do nothing when removing a partial scss.
        } else {
          var filenameNoExtension = helper.stripFileExtension(filename);
          var distDirectory = helper.getSiblingDistFolder(path);
          del([distDirectory + '/' + filenameNoExtension + '.css']);
          del([distDirectory + '/maps/' + filenameNoExtension + '.css.map']);

          createStyleguide.createKss(gulptheme);
        }
      });
  },
  componentTwig: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.twig',
      '!'  + gulptheme.path + 'components/**/*.html.twig'
    ])
      .on("change", function(path, stats) {
        createStyleguide.createKss(gulptheme);
      })
      .on("add", function(path, stats) {
        createStyleguide.createKss(gulptheme);
      })
      .on("unlink", function(path, stats) {
        createStyleguide.createKss(gulptheme);
      })
  },
  componentHTMLTwig: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.html.twig'
    ])
      .on('add', function(path, stats) {
        gulpFunctions.lintHTMLFile(path);
        gulpFunctions.rebuildDrupalCache('Adding ' + path + ' needs a cache rebuild!');
      })
      .on("change", function(path, stats) {
        gulpFunctions.lintHTMLFile(path);
        browsersyncHelper.reload();
      })
      .on('unlink', function(path, stats) {
        gulpFunctions.rebuildDrupalCache('Removing ' + path + ' needs a cache rebuild!');
      });
  },
  componentJS: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.js',
      '!' + gulptheme.path + 'components/**/dist/*.js',
      '!' + gulptheme.path + 'components/**/*.min.js',
      '!' + gulptheme.path + 'components/**/node_modules/*.js'
    ], { base: '.' })
      .on("change", function(path, stats) {
        var filename = helper.getLastParts(path, 1);
        /*
         * If we save a partial,
         * we should generate the all the scss files that don't have an underscore form that component.
         */
        if(filename.startsWith("_")) {
          var directorysAroundComponents = path.split('components/');
          var directoryAfter = directorysAroundComponents[1].split( '/' ).slice( 0, 1 );
          gulpFunctions.reSaveAllComponentJS(gulptheme.path + 'components/' + directoryAfter);
        } else {
          helper.compressJSFile(path);
          gulpFunctions.lintJSFile(path);
        }
      })
      .on("add", function(path, stats) {
        var filename = helper.getLastParts(path, 1);

        if(filename.startsWith("_")) {
          // do nothing when adding a partial scss.
        } else {
          helper.compressJSFile(path);
          gulpFunctions.lintJSFile(path);
        }
      })
      .on("unlink", function(path, stats) {
        var destination = helper.getSiblingDistFolder(path);
        var filename = helper.getLastParts(path, 1);

        if(filename.startsWith("_")) {
          // do nothing when adding a partial scss.
        } else {
          del([destination + '/' + filename]);
          del([destination + '/maps/' + filename + '.map']);
        }
      });
  },
  componentImages: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.jpg',
      gulptheme.path + 'components/**/*.jpeg',
      gulptheme.path + 'components/**/*.png',
      gulptheme.path + 'components/**/*.gif',
      gulptheme.path + 'components/**/*.svg',
      '!' + gulptheme.path + 'components/**/dist/*.*'
    ])
      .on('change', function(path, stats) {
        gulpFunctions.minifyImage(path);
      })
      .on('add', function(path, stats) {
        gulpFunctions.minifyImage(path);
      })
      .on('unlink', function(path, stats) {
        var distFolder = helper.getSiblingDistFolder(path);
        var filename = helper.getLastParts(path, 1);

        del([distFolder + '/' + filename]);
      });
  },
  themeLibraries: function(gulptheme) {
    gulp.watch([
      gulptheme.path + '*.libraries.yml'
    ])
      .on('change', function(path, stats) {
        gulpFunctions.rebuildDrupalCache('Changing the theme libraries needs a cache rebuild!');
      });
  },
  componentLibraries: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/libraries.yml'
    ])
      .on('change', function(path, stats) {
        gulpFunctions.lintYmlFile(path);
        gulpFunctions.rebuildDrupalCache('Changing the library definition of ' + path + ' needs a cache rebuild!');
      })
      .on('unlink', function(path, stats) {
        gulpFunctions.rebuildDrupalCache('Removing the library definition of ' + path + ' needs a cache rebuild!');
      })
      .on('add', function(path, stats) {
        gulpFunctions.lintYmlFile(path);
        gulpFunctions.rebuildDrupalCache('Adding a new library definition: ' + path + ', needs a cache rebuild!');
      });
  },
  componentThemePartial: function(gulptheme) {
    gulp.watch([
      gulptheme.path + 'components/**/*.theme'
    ])
      .on('change', function(path, stats) {
        gulpFunctions.lintPHPFile(path);
      })
      .on('unlink', function(path, stats) {
        gulpFunctions.rebuildDrupalCache('Removing ' + path + ', needs a cache rebuild!');
      })
      .on('add', function(path, stats) {
        gulpFunctions.lintPHPFile(path);
        gulpFunctions.rebuildDrupalCache('Adding ' + path + ', needs a cache rebuild!');
      });
  }
}
