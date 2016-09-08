// Karma configuration
// Generated on Wed Sep 07 2016 16:19:30 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    // frameworks: ['mocha', 'chai'],
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // angular source code
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/ngstorage/ngStorage.js',
      'node_modules/angular-sanitize/angular-sanitize.js',

      'node_modules/angular-ui-router/angular-ui-router.js',

      // our application code
      // Wildcards will not work here, as it defaults to alphabetical order
      'compiled/client/routes.js',
      'compiled/client/controllers/controller.js',
      'compiled/client/services/services.js',
      'compiled/tests/client/serviceGreeter.js',

      // example file
      'src/tests/client/example.js',

      // spec files
      'src/tests/client/serviceGreeter.spec.js',
      'src/tests/client/controller.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter

    // Use karma-mocha-reporter to pretty print test results in the console
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher

    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
