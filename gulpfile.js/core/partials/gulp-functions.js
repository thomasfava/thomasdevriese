var gulp = require('gulp');
var browsersyncHelper = require('./browsersync');
var helper = require("./helper-functions.js");
var localConfig = helper.haveLocalConfig();
var projectConfig = require("../../project.config");
var customIncludePaths = helper.getIncludePaths();
var shell = require('gulp-shell');
var notifier = require('node-notifier');
var imagemin = require('gulp-imagemin');
var sassGlob = require('gulp-sass-glob');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var savefile = require('gulp-savefile');
var removeDirectories = require('remove-empty-directories');
var tap = require('gulp-tap');
var yaml = require('gulp-yaml-validate');
var phplint = require("phplint").lint;
var htmlhint_inline = require('gulp-htmlhint-inline');
var eslint = require('gulp-eslint');
var cache_clear_in_progress = false;

// Only if we chose to use the clean-css library, load it in.
var cleanCSS = function(){ return true; };
if (projectConfig.features.clean_css.enable) {
  cleanCSS = require('gulp-clean-css');
}

module.exports = {
  cleanUp: function(gulptheme) {
    var removed = removeDirectories(gulptheme.path + 'components/');
    if (removed.length > 0) {
      console.log("removing following folders, because they are empty:");
      console.log(removed);
    }
  },
  lintYmlFile: function(path) {
    if (localConfig.features.validate_yml.enable) {
      // We choose to pass (-2) on the name of the parent folder too here,
      // because each name of a .yml file, will be the same otherwise
      var filename = helper.getLastParts(path, 2);

      gulp.src(path)
        .pipe(yaml()
          .on('error', function (err) {
            if(localConfig.notifications.yml.validation_errors) {
              helper.handleError(err, filename, 'yml', 'loud');
            } else {
              helper.handleError(err, filename, 'yml', 'silent');
            }
          })
        )
    }
  },
  lintPHPFile: function(path) {
    if (localConfig.features.lint_php.enable) {
      var filename = helper.getLastParts(path, 1);

      gulp.src(path)
        .pipe(tap(
          function(file, t) {
            phplint([path], { limit: 10 }, function(err, stdout, stderr) {
              if (err) {
                if(localConfig.notifications.php.linting_errors) {
                  helper.handleError(err, filename, 'php', 'loud');
                } else {
                  helper.handleError(err, filename, 'php', 'silent');
                }
              }
            })
          }
        ))
    }
  },
  lintHTMLFile: function(path) {
    if (localConfig.features.lint_html.enable) {
      var filename = helper.getLastParts(path, 1);

      var html_linting_options = {
        htmlhintrc: './gulpfile.js/core/options/htmlhintrc.js',
        ignores: {
          '{%': '%}', // Twig functionality
          '{{': '}}', // Twig variables
          '{#': '#}', // Twig comments
          'src="{{': '}}"', // src tags that are filled in with variable
          '<head-placeholder': '>', // Drupal placeholder
          '<css-placeholder': '>', // Drupal placeholder
          '<js-placeholder': '>', // Drupal placeholder
          '<js-bottom-placeholder': '>', // Drupal placeholder
          '<svg': '</svg>' // SVG's
        },
        patterns: []
      };

      var customReporter = function (file) {
        if (!file.htmlhint_inline.success) {
          // console.log(file.htmlhint_inline);
          file.htmlhint_inline.forEach(function themeSpecific(error, themeindex) {
            if (typeof error === 'object' && error !== null) {
              if(localConfig.notifications.html.linting_errors) {
                helper.handleError(error, filename, 'Twig', 'loud');
              } else {
                helper.handleError(error, filename, 'Twig', 'silent');
              }
            }
          })
        }
      }

      gulp.src(path)
        .pipe(htmlhint_inline(html_linting_options))
        .pipe(htmlhint_inline.reporter(customReporter));
    }
  },
  lintJSFile: function(path) {
    if (localConfig.features.lint_js.enable) {
      gulp.src(path)
        //All options on https://gist.github.com/adrianhall/70d63d225e536b4563b2
        .pipe(eslint({
          useEslintrc: false,
          "configFile": './gulpfile.js/core/options/.eslintrc.json',
        }))
        .pipe(eslint.format())
      console.log('linted ' + path + ' js');
    }
  },
  rebuildDrupalCache: function(message) {
    // Only go through the process if there is a cache_clear command
    if (localConfig.features.auto_rebuild_drupal_cache.enable) {
      // Only go through the process if the previous cache clear has completed already
      if (cache_clear_in_progress == false) {
        cache_clear_in_progress = true;

        return gulp.src('gulpfile.js')
          .pipe(tap(function(file, t) {
            if(localConfig.notifications.internal.cache_rebuilding_status) {
              notifier.notify({
                title: "Drupal Cache",
                message: "Rebuilding...",
                icon: `gulpfile.js/core/icons/compony.png`
              });
            }

            console.log(message);
            console.log(localConfig.features.auto_rebuild_drupal_cache.cache_rebuild_command);
          }))
          .pipe(
            shell([
              localConfig.features.auto_rebuild_drupal_cache.cache_rebuild_command
            ])
            .on('error', function (err) {
              if(localConfig.notifications.internal.cache_rebuild_error) {
                helper.handleError(err, localConfig.features.auto_rebuild_drupal_cache.cache_rebuild_command, 'Shell', 'loud');
              } else {
                helper.handleError(err, localConfig.features.auto_rebuild_drupal_cache.cache_rebuild_command, 'Shell', 'silent');
              }

              cache_clear_in_progress = false;
            })
          )
          .pipe(tap(function(file, t) {
            if(localConfig.notifications.internal.cache_rebuilding_status) {
              notifier.notify({
                title: "Drupal Cache",
                message: "Rebuilt!",
                icon: `gulpfile.js/core/icons/compony.png`
              });
            }
          }))
          .on('data', function() {
            browsersyncHelper.reload();
            cache_clear_in_progress = false;
          })
          .on('end', function() {
            browsersyncHelper.reload();
          });
      }
    }
  },
  minifyImage: function(path) {
    var destination = helper.getSiblingDistFolder(path);

    gulp.src(path)
      .pipe(imagemin([
        imagemin.gifsicle(projectConfig.features.image_optimise.gifsicle),
        imagemin.optipng(projectConfig.features.image_optimise.optipng),
        imagemin.jpegtran(projectConfig.features.image_optimise.jpegtran),
        imagemin.svgo(projectConfig.features.image_optimise.svgo)
      ]))
      .pipe(gulp.dest(destination));
  },
  compileAndMapSassFile: function(path, gulptheme, sync) {
    var filename = helper.getLastParts(path, 1);
    var destination = helper.getSiblingDistFolder(path);
    var autoprefixerOptions = projectConfig.features.autoprefixer.options;

    gulp.src(path)
      .pipe(gulpif(projectConfig.features.css_mapping.enable, sourcemaps.init()))
      .pipe(sassGlob())
      .pipe(
        sass({
          noCache: true,
          outputStyle: "compressed",
          lineNumbers: false,
          loadPath: './css/*',
          sourceMap: true,
          includePaths: customIncludePaths[gulptheme.key]
        })
        .on('error', function (err) {
          if(localConfig.notifications.css.sass_errors) {
            helper.handleError(err, filename, 'sass', 'loud');
          } else {
            helper.handleError(err, filename, 'sass', 'silent');
          }
        })
      )
      .pipe(gulpif(projectConfig.features.autoprefixer.enable, autoprefixer(autoprefixerOptions)))
      .pipe(gulpif(projectConfig.features.clean_css.enable, cleanCSS()))
      .pipe(tap(function(file, t) {
        console.log('CSS: Compiled ' + path);
        if (sync && localConfig.features.browsersync.enable) {
          browsersyncHelper.stream();
        }
      }))
      .pipe(gulpif(projectConfig.features.css_mapping.enable, sourcemaps.write('./maps')))
      .pipe(gulp.dest(destination));
  },
  reSaveAllComponentJS: function(componentDir) {
    gulp.src([
      componentDir + '/**/*.js',
      '!' + componentDir + '/**/dist/*.js',
      '!' + componentDir + '/**/*.min.js',
      '!' + componentDir + '/**/_*.js',
      '!' + componentDir + '/**/node_modules/*.js'
    ])
      .pipe(savefile());
  },
  reSaveAllComponentSCSS: function(componentDir) {
    gulp.src([
      componentDir + '/**/*.scss',
      '!' + componentDir + '/**/_*.scss'
    ])
      .pipe(savefile());
  },
  reSaveAllThemeComponentsSCSS: function(theme) {
    gulp.src([
      theme + 'components/**/*.scss',
      '!' + theme + 'components/**/_*.scss'])
      .pipe(savefile());
  },
  reSaveAllThemeComponentsJS: function(gulptheme) {
    gulp.src([
      gulptheme.path + 'components/**/*.js',
      '!' + gulptheme.path + 'components/**/dist/*.js',
      '!' + gulptheme.path + 'components/**/*.min.js',
      '!' + gulptheme.path + 'components/**/_*.js',
      '!' + gulptheme.path + 'components/**/node_modules/*.js'
    ], { base: '.' })
      .pipe(savefile());
  },
  compileAllImages: function(path) {
    gulp.src(path, { base: '.' })
      .pipe(imagemin([
        imagemin.gifsicle(projectConfig.features.image_optimise.gifsicle),
        imagemin.optipng(projectConfig.features.image_optimise.optipng),
        imagemin.jpegtran(projectConfig.features.image_optimise.jpegtran),
        imagemin.svgo(projectConfig.features.image_optimise.svgo)
      ]))
      .pipe(rename(function (path) {
        path.dirname += "/dist";
      }))
      .pipe(gulp.dest('./'));
  },
  uglifyAndMapJSFile: function(path) {
    var destination = helper.getSiblingDistFolder(path);
    var filename = helper.getLastParts(path, 1);

    gulp.src(path)
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
      .pipe(gulp.dest(destination))
      .pipe(shell([
        'echo "JS:  Compiled ' + path + '"'
      ]))
      .on('end', function() {
        browsersyncHelper.reload();
      })
  }
};
