
module.exports = function (config) {
    config.set({
        autoWatch: true,

        browsers: [
            'PhantomJS',
        ],

        colors: true,

        files: [
            '<%= testsPath %>/libs/es5-shim.js',
            '<%= testsPath %>/libs/jasmine.js',
            '<%= testsPath %>/libs/jasmine-matchers.js',
            '<%= testsPath %>/spec/**/*.js',
            {
                pattern: '<%= sourcePath %>/js/**/*.js',
                watched: true,
                included: false,
                served: false,
            },
        ],

        frameworks: [
            'jasmine',
        ],

        plugins: [
            require('karma-webpack'),
            'karma-spec-reporter',
            'karma-jasmine',
            'karma-phantomjs-launcher',
        ],

        preprocessors: {
            '<%= testsPath %>/spec/**/*.js': ['webpack'],
        },

        reporters: [
            'spec',
        ],

        webpack: require('./webpack-karma.config.js'),

        webpackMiddleware: {
            stats: {
                colors: true,
            },
        },
    });
};
