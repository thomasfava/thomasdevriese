var notifier = require('node-notifier');

module.exports = {
  getLastParts: function(path, parts) {
    // This function will take the last {{ parts }} parts from {{ path }}
    // Each part is separated by a '/'.

    // Example: this input web/themes/compony/components/form-item/form-item--select/select.js
    // With parts set to 1, the output will be: select.js
    // With parts set to 2, the output will be: form-item--select/select.js
    var filename = path.split('/').slice( -parts ).join('/');
    return filename;
  },
  getSiblingDistFolder: function(path, parts) {
    // Example: this input web/themes/compony/components/onomasticon/onomasticon.js
    // Will return: web/themes/compony/components/onomasticon/dist
    var distFolder = path.split('/').slice( 0, -1 ).join('/') + '/dist';
    return distFolder;
  },
  stripFileExtension: function(name) {
    // Remove the last extension of a filename:

    // Example A: this input: fily.scss
    // Will return: fily

    // Example B: this input: fily.weirly.scss
    // will return fily.weirdly
    var bareName = name.split('.').slice( 0, -1 ).join('.');
    return bareName;
  },
  getIncludePaths: function() {
    var customIncludePaths = [];
    var projectConfig = require("../../project.config");

    projectConfig.gulpthemes.forEach(function themeSpecific(gulptheme, themeindex) {
      if(gulptheme.path == '') {
        gulptheme.key = 'current';
      } else if (gulptheme.path.substr(-1) !== "/" ) {
        gulptheme.path = gulptheme.path + '/';
        gulptheme.key = gulptheme.path;
      } else {
        gulptheme.key = gulptheme.path;
      }

      // For every theme, put the sass_essentials directory in a var.
      var sass_essentials = gulptheme.path + '_sass-essentials';

      // Create an array of includePaths for every gulptheme.
      // This is handy because we don't want to include all the variables from all the themes under sass-essentials.
      customIncludePaths[gulptheme.key] = [];
      customIncludePaths[gulptheme.key].push(sass_essentials);

      if (projectConfig.features.sass_includes.bourbon) {
        try {
          var bourbon = require("bourbon").includePaths;
          customIncludePaths[gulptheme.key].push(bourbon);
        } catch (err) {
          console.log('You indicated in project.config.js that you would like to use Bourbon within Sass, but you haven\'t installed that npm package yet.');
          console.log('Please run `npm install bourbon@5.1.0` and then restart Gulp again');
          console.log(err);
        }
      }

      // Only if we chose to use the clean-css library, load it in.
      if (projectConfig.features.sass_includes.bourbonNeat) {
        try {
          var neat = require("bourbon-neat").includePaths;
          customIncludePaths[gulptheme.key].push(neat);
        } catch (err) {
          console.log('You indicated in project.config.js that you would like to use Bourbon Neat within Sass, but you haven\'t installed that npm package yet.');
          console.log('Please run `npm install bourbon-neat@1.9.1` and then restart Gulp again');
          console.log(err);
        }
      }

      // Only if we chose to use the clean-css library, load it in.
      if(projectConfig.features.sass_includes.breakpoint) {
        try {
          // This variable is not really needed,
          // but it is to test if you have the npm package installed
          var tryout = require('breakpoint-sass/package.json');

          var breakpoint = 'node_modules/breakpoint-sass/stylesheets';
          customIncludePaths[gulptheme.key].push(breakpoint);
        } catch (err) {
          console.log('You indicated in project.config.js that you would like to use Breakpoint within Sass, but you haven\'t installed that npm package yet.');
          console.log('Please run `npm install breakpoint-sass@2.7.1` and then restart Gulp again');
          console.log(err);
        }
      }
    });

    return customIncludePaths;
  },
  haveLocalConfig: function() {
    var localConfig = require("./../../config.js");
    var fs = require("fs");

    // If a local.config.js file exists, use that instead of config.js
    if (fs.existsSync(__dirname + "/../../local.config.js")) {
      localConfig = {};
      localConfig = require("./../../local.config");
    }

    return localConfig;
  },
  // Pass the argument and type, css/js to display different notifications depending on the type.
  handleError: function(err, filename='', type='default', noise='loud') {
    var notifier_title = `${type.toUpperCase()} error!`;

    if(type == 'sass') {
      var message = `on line ${err.line} of ${filename}`;
    } else if(type == 'Twig'){
      var message = `in ${filename}`;
      var err = `Warning on ${filename} @ line ${err.line}: ${err.message}`;
      notifier_title = `${type.toUpperCase()} warning!`;
    } else if(err.lineNumber) {
      // This is used mostly by JS, but the uglify method of js stores the linenumber in a different key of variable.
      var message = `on line ${err.lineNumber} of ${filename}`;
    } else {
      // The bundle method of browserify doesn't pass along a linenumber.
      var message = `in ${filename}`;
    }

    if(noise == 'loud') {
      notifier.notify({
        title: notifier_title,
        message: message,
        icon: `gulpfile.js/core/icons/compony.png`
      });
    }

    console.log(err.toString());
  },
  compressJSFile: function(path) {
    var browserifyFunctions = require("./browserify-functions.js");
    var projectConfig = require("../../project.config");
    // When using browserify, the proces, starts of differently.
    if(projectConfig.features.browserify.enable) {
      browserifyFunctions.browserifyFile(path, true);
    }
    else {
      var gulpFunctions = require('./gulp-functions.js');

      // When not using browserify, just normally compile a js-file.
      gulpFunctions.uglifyAndMapJSFile(path);
    }
  }
};
