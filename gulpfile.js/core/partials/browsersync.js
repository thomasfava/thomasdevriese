var browserSync = require('browser-sync');
var helper = require('./helper-functions.js');
var localConfig = helper.haveLocalConfig();

module.exports = {
  init: function() {
    if (localConfig.features.browsersync.enable) {
      browserSync.create();

      browserSync.init({
        proxy: localConfig.features.browsersync.localhost_url,
        open: true,
      });

      console.log('Initialising browserSync for ' + localConfig.features.browsersync.localhost_url);
    }
  },
  reload: function() {
    if (localConfig.features.browsersync.enable) {
      browserSync.reload();
    }
  },
  stream: function(file) {
    console.log('Restreaming browserSync');
    return browserSync.stream();
  }
}
