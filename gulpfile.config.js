module.exports = {
  'baseDir': 'http/',

  'browserSync': {
    enabled : false,
    // This must be changed to the correct proxy of your project. Example: 'www.o2.loc' or 'o2.loc'.
    proxy: 'www.thomasdevriese.loc',
    // This opens the external IP, we have also the options: 'local' (opens the localhost), 'ui' (opens the ui IP)
    open: 'external',
    // Available browsers: 'chromium', 'google chrome', 'firefoxdeveloperedition', 'firefox', 'safari', 'opera'
    browser: ['google chrome']
  }
};
