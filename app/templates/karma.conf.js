
require('babel-register');

var path = require('path');

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

        webpack: Object.assign({}, require('./webpack.config.babel.js'), {
            module: {
                loaders: [
                    {
                        test: /\.js?$/,
                        include: [
                            path.resolve(__dirname, '<%= testsPath %>/spec'),
                            path.resolve(__dirname, '<%= sourcePath %>'),
                        ],
                        loader: 'babel',
                    },
                ],
            },
        }),

        webpackMiddleware: {
            stats: {
                colors: true,
            },
        },
    });
};
