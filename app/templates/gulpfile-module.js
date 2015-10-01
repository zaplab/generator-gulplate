
'use strict';

var argv = require('yargs').argv;<% if (testMocha) { %>
var connect = require('gulp-connect');<% } %>
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');<% if (testSassLint) { %>
var sassLint = require('gulp-sass-lint');<% } %>
var cssmin = require('gulp-cssmin');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');<% if (testESLint) { %>
var eslint = require('gulp-eslint');<% } %>
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');<% if (testMocha) { %>
var mochaPhantomJS = require('gulp-mocha-phantomjs');<% } %>
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var header = require('gulp-header');<% if (moduleLoader == "requirejs") { %>
var requirejsOptimize = require('gulp-requirejs-optimize');<% } %>
var eventStream = require('event-stream');<% if (featureModernizr) { %>
var modernizr = require('gulp-modernizr');<% } %>

var isDevMode = false,
    isServeTask = false,<% if (testMocha) { %>
    testServerPort = 8080,<% } %>
    pkg = require('./package.json'),
    banner = ['/*!',
        ' <%%= pkg.name %> <%%= pkg.version %>',
        ' Copyright ' + new Date().getFullYear() + ' <%%= pkg.author.name %> (<%%= pkg.author.url %>)',
        ' All rights reserved.',
        ' <%%= pkg.description %>',
        '*/'].join('\n');

switch (argv.target) {
    case 'dev':
        /* falls through */
    case 'development':
        isDevMode = true;
        break;
    default:
        isDevMode = false;
}

// Workaround for https://github.com/gulpjs/gulp/issues/71
var origSrc = gulp.src;
gulp.src = function () {
    return fixPipe(origSrc.apply(this, arguments));
};
function fixPipe(stream) {
    var origPipe = stream.pipe;
    stream.pipe = function (dest) {
        arguments[0] = dest.on('error', function (error) {
            var nextStreams = dest._nextStreams;
            if (nextStreams) {
                nextStreams.forEach(function (nextStream) {
                    nextStream.emit('error', error);
                });
            } else if (dest.listeners('error').length === 1) {
                throw error;
            }
        });
        var nextStream = fixPipe(origPipe.apply(this, arguments));
        (this._nextStreams || (this._nextStreams = [])).push(nextStream);
        return nextStream;
    };
    return stream;
}

// clear
gulp.task('clean:end', function (cb) {
    del([
        'tmp',
    ], cb);
});

gulp.task('clean', function (cb) {
    del([
        '<%= distributionPath %>/css',
        '<%= distributionPath %>/img',
        '<%= distributionPath %>/js',
    ], cb);
});
<% if (testESLint) { %>
gulp.task('eslint', function() {
    return gulp.src('<%= sourcePath %>/js/**/*.js')
        .pipe(eslint({
            configFile: '<%= testsPath %>/.eslintrc',
        }))
        .pipe(eslint.format())
        .on('error', function (error) {
            console.error('' + error);
        });
});
<% } %><% if (testMocha) { %>
gulp.task('mocha', function () {
    connect.server({
        root: '<%= testsPath %>',
        port: testServerPort,
    });

    gulp.src([
            '<%= sourcePath %>/js/module-a.js',
            '<%= sourcePath %>/js/main.js',
        ])
        .pipe(concat('main.js'))
        .pipe(gulp.dest('<%= testsPath %>/dist/js'));

    var stream = mochaPhantomJS();
    stream.write({
        path: 'http://localhost:' + testServerPort + '/index.html',
        reporter: 'spec',
    });
    stream.end();

    stream.on('end', function () {
        connect.serverClose();
    });

    stream.on('error', function (error) {
        connect.serverClose();
    });

    return stream;
});

gulp.task('setup-tests', function (cb) {
    eventStream.concat(
        // mocha
        gulp.src([
                '<%= sourcePath %>/libs/bower/mocha/mocha.css',
                '<%= sourcePath %>/libs/bower/mocha/mocha.js',
            ])
            .pipe(gulp.dest('<%= testsPath %>/libs')),
        // chai
        gulp.src('<%= sourcePath %>/libs/bower/chai/chai.js')
            .pipe(gulp.dest('<%= testsPath %>/libs')),
        // requirejs
        gulp.src('<%= sourcePath %>/libs/bower/requirejs/require.js')
            .pipe(gulp.dest('<%= testsPath %>/libs'))
    ).on('end', cb);
});

gulp.task('setup', [
    'setup-tests',
]);
<% } %><% if (testSassLint) { %>
gulp.task('test-css', function() {
    return gulp.src('<%= sourcePath %>/css/**/*.scss')
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .on('error', function (error) {
            console.error('' + error);
        });
});<% } %>

gulp.task('test-js', [<% if (testESLint) { %>
    'eslint',<% } %><% if (testMocha) { %>
    'mocha',<% } %>
]);

gulp.task('test', [<% if (testSassLint) { %>
    'test-css',<% } %>
    'test-js',
]);

gulp.task('css', ['test-css'], function() {
    return gulp.src('<%= sourcePath %>/css/main.scss')
        .pipe(gulpif(isDevMode, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: [
                '<%= sourcePath %>/libs/bower',
            ],
        }))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, cssmin()))
        .pipe(gulp.dest('<%= distributionPath %>/css'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.css'
        })))
        .on('error', function (error) {
            console.error('' + error);
        });
});<% if (addDocumentation && featureModernizr) { %>

gulp.task('modernizr', function() {
    return gulp.src([
            '<%= sourcePath %>/css/**/*.scss',
            '<%= sourcePath %>/js/**/*.js',
        ])
        .pipe(modernizr('init.js', {
            options: [
                'setClasses',
                'testProp',
            ],
        }))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some'
        })))
        .pipe(gulp.dest('<%= documentationPath %>/resources/js'))
});<% } %>

gulp.task('js', [<% if (testESLint) { %>
    'eslint',<% } %><% if (addDocumentation && featureModernizr) { %>
    'modernizr',<% } %>
], function() {<% if (moduleLoader == "requirejs") { %>
    return gulp.src('<%= sourcePath %>/js/main.js')
        .pipe(requirejsOptimize({
            baseUrl: './',
            optimize: 'none',
            mainConfigFile: '<%= sourcePath %>/js/config/requirejs.js',
            name: '<%= sourcePath %>/js/main.js',
        }))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some',
        })))
        .pipe(gulp.dest('<%= distributionPath %>/js'))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %><% if (moduleLoader == "webpack") { %>
    var myConfig = {
        context: './',
        entry: '<%= sourcePath %>/js/main.js',
        output: {
            path: '<%= distributionPath %>/resources/js/',
            filename: 'main.js',
        },
        resolve: {
            root: './',
            // Directory names to be searched for modules
            modulesDirectories: [
                '<%= sourcePath %>/js',
                '<%= sourcePath %>/libs/bower',
                'node_modules',
            ]
        },
        plugins: [
            new webpack.ResolverPlugin(
                new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
            )
        ],
        devtool: isDevMode ? 'sourcemap' : ''
    };

    if (!isDevMode) {
        myConfig.plugins = myConfig.plugins.concat(
            new webpack.optimize.UglifyJsPlugin()
        );
    }

    webpack(myConfig, function(err, stats) {
        if(err) throw new gutil.PluginError('webpack', err);
        gutil.log('[webpack]', stats.toString({
            // output options
        }));
        callback();
    });<% } %><% if (moduleLoader == "none") { %>
    return gulp.src([
            '<%= sourcePath %>/js/module-a.js',
            '<%= sourcePath %>/js/main.js',
        ])
        .pipe(gulpif(isDevMode, sourcemaps.init()))
        .pipe(concat('main.js'))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some',
        })))
        .pipe(gulp.dest('<%= distributionPath %>/js'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.js'
        })))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %>
});

gulp.task('fonts', function() {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= distributionPath %>/fonts'))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images', function() {
    return gulp.src('<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false,
            }],
            use: [
                pngquant(),
            ]
        }))
        .pipe(gulp.dest('<%= distributionPath %>/img'))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('watch', function () {
    gulp.watch('<%= sourcePath %>/css/**/*.scss', ['css']);
    gulp.watch('<%= sourcePath %>/js/**/*.js', ['js']);
    gulp.watch('<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}', ['images']);
});<% if (addDocumentation) { %>

gulp.task('_serve', [
    'default',
    'watch',
], function () {
    browserSync({
        server: {
            baseDir: '<%= documentationPath %>'
        }
    });

    gulp.watch('<%= documentationPath %>/**/*.html', browserSync.reload);
    gulp.watch('<%= documentationPath %>/resources/js/**/*.js', browserSync.reload);
    gulp.watch('<%= documentationPath %>/resources/img/**/*.{gif,jpg,png,svg}', browserSync.reload);
});

gulp.task('serve', function () {
    isServeTask = true;

    if (typeof argv.target === 'undefined') {
        isDevMode = true;
    }

    gulp.run('_serve');
});<% } %>

gulp.task('default', ['clean'], function (cb) {
    runSequence(
        [
            'css',
            'js',
            'images',
        ],
        'clean:end',
        cb
    );
});
