
'use strict';

var argv = require('yargs').argv;<% if (testMocha) { %>
var connect = require('gulp-connect');<% } %>
var del = require('del');
var gulp = require('gulp');<% if ((moduleLoader == "none") && (jsVersion != "es5")) { %>
var babel = require('gulp-babel');<% } %>
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
var eventStream = require('event-stream');<% if (moduleLoader == "webpack") { %>
var gutil = require('gulp-util');
var webpack = require('webpack');<% } %><% if (featureModernizr) { %>
var modernizr = require('gulp-modernizr');<% } %>
var path = require('path');

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
gulp.task('clean', function (cb) {
    del([
        '<%= distributionPath %>/css',
        '<%= distributionPath %>/fonts',
        '<%= distributionPath %>/img',
        '<%= distributionPath %>/js',
    ], cb);
});<% if (addDocumentation) { %>

gulp.task('clean:doc', function (cb) {
    del([
        '<%= documentationPath %>/resources/css/main.css.map',
        '<%= documentationPath %>/resources/main.js.map',
    ], cb);
});<% } %><% if (testESLint) { %>

gulp.task('eslint', function () {
    return gulp.src('<%= sourcePath %>/js/**/*.js')
        .pipe(eslint({
            configFile: '<%= testsPath %>/.eslintrc',
        }))
        .pipe(eslint.format())
        .on('error', function (error) {
            console.error('' + error);
        });
});<% } %><% if (testMocha) { %>

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
gulp.task('test-css', function () {
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
]);<% if (addDocumentation) { %>

gulp.task('jekyll', function (gulpCallBack) {
    var spawn = require('child_process').spawn;
    var jekyll = spawn('bundler', [
        'exec',
        'jekyll',
        'build',
        '--source', '<%= sourcePath %>/jekyll',
        '--destination', '<%= documentationPath %>',
    ], {
        stdio: 'inherit'
    });

    jekyll.on('exit', function (code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
});<% } %>

gulp.task('css', ['test-css'], function () {
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
        .on('error', function (error) {
            console.error('' + error);
        });
});<% if (addDocumentation && featureModernizr) { %>

gulp.task('modernizr', function () {
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

gulp.task('js', <% if (testESLint) { %>[
    'eslint',
], <% } %>function (<% if (moduleLoader == "webpack") { %>callback<% } %>) {<% if (moduleLoader == "requirejs") { %>
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
            path: '<%= distributionPath %>/js/',
            filename: 'main.js',
        },<% if (jsVersion != "es5") { %>
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: /(node_modules|<%= sourcePath %>\/libs\/bower)/,
                    loader: 'babel',
                }
            ]
        },<% } %>
        resolve: {
            root: './',
            modulesDirectories: [
                '<%= sourcePath %>/js',
                '<%= sourcePath %>/libs/bower',
                'node_modules',
            ]
        },
        resolveLoader: {
            root: path.join(__dirname, 'node_modules')
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

    webpack(myConfig, function (err, stats) {
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
        .pipe(gulpif(isDevMode, sourcemaps.init()))<% if ((moduleLoader == "none") && (jsVersion != "es5")) { %>
        .pipe(babel())<% } %>
        .pipe(concat('main.js'))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some',
        })))
        .pipe(gulp.dest('<%= distributionPath %>/js'))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %>
});

gulp.task('fonts', function () {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= distributionPath %>/fonts'))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images', function () {
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
});<% if (addDocumentation) { %>
gulp.task('css:doc', ['test-css'], function () {
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
        .pipe(gulp.dest('<%= documentationPath %>/resources/css'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.css'
        })))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('js:doc', <% if (testESLint) { %>[
    'eslint',
], <% } %>function (<% if (moduleLoader == "webpack") { %>callback<% } %>) {<% if (moduleLoader == "requirejs") { %>
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
        .pipe(gulp.dest('<%= documentationPath %>/resources/js'))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %><% if (moduleLoader == "webpack") { %>
    var myConfig = {
        context: './',
        entry: '<%= sourcePath %>/js/main.js',
        output: {
            path: '<%= documentationPath %>/resources/js/',
            filename: 'main.js',
        },<% if (jsVersion != "es5") { %>
        module: {
            loaders: [
                {
                    test: /\.js?$/,
                    exclude: /(node_modules|<%= sourcePath %>\/libs\/bower)/,
                    loader: 'babel-loader',
                }
            ]
        },<% } %>
        resolve: {
            root: './',
            modulesDirectories: [
                '<%= sourcePath %>/js',
                '<%= sourcePath %>/libs/bower',
                'node_modules',
            ]
        },
        resolveLoader: {
            root: path.join(__dirname, 'node_modules')
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

    webpack(myConfig, function (err, stats) {
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
        .pipe(gulpif(isDevMode, sourcemaps.init()))<% if ((moduleLoader == "none") && (jsVersion != "es5")) { %>
        .pipe(babel())<% } %>
        .pipe(concat('main.js'))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some',
        })))
        .pipe(gulp.dest('<%= documentationPath %>/resources/js'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.js'
        })))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %>
});

gulp.task('fonts:doc', function () {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= documentationPath %>/fonts'))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images:doc', function () {
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
        .pipe(gulp.dest('<%= documentationPath %>/img'))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('watch', function () {
    gulp.watch('<%= sourcePath %>/css/**/*.scss', ['css:doc']);
    gulp.watch('<%= sourcePath %>/js/**/*.js', ['js:doc']);
    gulp.watch('<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}', ['images:doc']);
    gulp.watch('<%= sourcePath %>/jekyll/**/*.html', function () {
        runSequence(
            'jekyll',
            [
                'css:doc',
                'js:doc',
                'fonts:doc',
                'images:doc',
            ],<% if (featureModernizr) { %>
            'modernizr'<% } %>
        );
    });
});

gulp.task('doc', ['clean:doc'], function (cb) {
    runSequence(
        'jekyll',
        [
            'css:doc',
            'js:doc',
            'fonts:doc',
            'images:doc',
        ],<% if (featureModernizr) { %>
        'modernizr',<% } %>
        cb
    );
});

gulp.task('_serve', [
    'doc',
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

    runSequence('_serve');
});<% } %>

gulp.task('default', ['clean'], function (cb) {
    runSequence(
        [
            'css',
            'js',
            'fonts',
            'images',
        ],
        cb
    );
});
