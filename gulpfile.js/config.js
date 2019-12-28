/*
 * Gulpfile.js orientation:
 * https://www.compony.io/docs/documentation/gulpfilejs-orientation
 *
 * Your local Gulp configuration:
 * https://www.compony.io/docs/documentation/localconfigjs
 */

module.exports = {
  features: {
    auto_rebuild_drupal_cache: {
      enable: false,
      cache_rebuild_command: 'drush cr'
    },
    browsersync: {
      enable: false,
      localhost_url: "https://local.dev/"
    },
    validate_yml: {
      enable: true,
    },
    lint_php: {
      enable: true,
    },
    lint_html: {
      enable: false,
    },
    lint_js: {
      enable: true,
    }
  },
  notifications: {
    html: {
      linting_errors: false,
    },
    css: {
      sass_errors: true
    },
    javascript: {
      browserify_errors: true,
      uglify_errors: true,
    },
    yml: {
      validation_errors: true,
    },
    php: {
      linting_errors: true,
    },
    internal: {
      cache_rebuilding_status: true,
      cache_rebuild_error: true,
    }
  }
};
