var globby = require('globby');
var helper = require('./helper-functions.js');
var projectConfig = require("../../project.config");

// Only if we chose to use the clean-css library, load it in.
var kss = function(){ return true; };
if (projectConfig.features.kss.enable) {
  kss = require('kss');
}

module.exports = {
  createKss: function(gulptheme) {
    if (gulptheme.with_styleguide && projectConfig.features.kss.enable) {
      // Empty the theme-specific-array.
      var alteredThemeName = gulptheme.path;
      // If the themepath is an emtpy string, just give a random key to work with.
      if(alteredThemeName == '') {
        alteredThemeName = 'current';
      }

      globby([
        gulptheme.path + 'components/**/*.css',
        '!' + gulptheme.path + 'components/**/*.css.map'
      ]).then(function(cssEntries) {
        var composedCssEntries = [];
        cssEntries.forEach(function themeSpecific(cssEntry, entryIndex) {
          composedCssEntries.push('../components/' + cssEntry.split("components/").pop());
        });

        globby([
          gulptheme.path + 'components/**/*.min.js',
          gulptheme.path + 'components/**/dist/*.js'
        ]).then(function(jsEntries) {
          var composedJsEntries = [];

          jsEntries.forEach(function themeSpecific(jsEntry, entryIndex) {
            composedJsEntries.push('../components/' + jsEntry.split("components/").pop());
          });

          var themename = helper.getLastParts(gulptheme.path, 1);

          return kss({
            source: [
              gulptheme.path + 'components/'
            ],
            destination: gulptheme.path + 'style-guide',
            builder: './gulpfile.js/core/kss-builder/',
            namespace: themename + ':' + __dirname + '/' + gulptheme.path + 'components',
            'extend-drupal8': true,
            // The css and js paths are URLs, like '/misc/jquery.js'.
            // The following paths are relative to the generated style guide.
            css: composedCssEntries,
            js: composedJsEntries,
            homepage: 'style-guide.md',
            title: 'Style Guide'
          });
        });
      });
    }
    else {
      return true;
    }
  }
}
