
'use strict';

var argv = require('yargs').argv;<% if (testMocha) { %>
var connect = require('gulp-connect');<% } %>
var del = require('del');
var gulp = require('gulp');<% if (transformJs) { %>
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
var header = require('gulp-header');
var eventStream = require('event-stream');<% if (moduleLoader == "webpack") { %>
var gutil = require('gulp-util');
var webpack = require('webpack');<% } %><% if (featureModernizr) { %>
var modernizr = require('gulp-modernizr');<% } %>
var path = require('path');

var isDevMode = false;
var isServeTask = false;<% if (testMocha) { %>
var testServerPort = 8080;<% } %>
var pkg = require('./package.json');
var banner = [
        '/*!',
        ' <%%= pkg.name %> <%%= pkg.version %>',
        ' Copyright ' + new Date().getFullYear() + ' <%%= pkg.author.name %> (<%%= pkg.author.url %>)',
        ' All rights reserved.',
        ' <%%= pkg.description %>',
        '*/'
    ].join('\n');

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
        '<%= distributionPath %>/resources/css/main.css.map',
        '<%= distributionPath %>/resources/fonts',
        '<%= distributionPath %>/resources/img',
        '<%= distributionPath %>/resources/js/main.js.map',
    ], cb);
});<% if (testESLint) { %>

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
            .pipe(gulp.dest('<%= testsPath %>/libs'))
    ).on('end', cb);
});

gulp.task('setup', [
    'setup-tests',
]);<% } %><% if (testSassLint) { %>

gulp.task('test-css', function () {
    return gulp.src('<%= sourcePath %>/css/**/*.scss')
        .pipe(sassLint({
            options: {
                'config-file': '<%= testsPath %>/.sass-lint.yml',
            },
        }))
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

gulp.task('test', [
    <% if (testSassLint) { %>'test-css',<% } %>
    'test-js',
]);<% if (htmlMetalsmith) { %>

gulp.task('templates', function () {
    var metalsmith = require('gulp-metalsmith');
    var metalsmithMarkdown = require('metalsmith-markdown');
    var metalsmithPath = require('metalsmith-path');
    var metalsmithLayouts = require('metalsmith-layouts');
    var handlebars = require('handlebars');

    handlebars.registerHelper('if_eq', function(a, b, opts) {
        if(a == b) // Or === depending on your needs
            return opts.fn(this);
        else
            return opts.inverse(this);
    });

    return gulp.src([
            '<%= sourcePath %>/templates/**/*.html',
            '!<%= sourcePath %>/templates/_includes/**/*',
            '!<%= sourcePath %>/templates/_layouts/**/*',
        ])
        .pipe(metalsmith({
            // set Metalsmith's root directory, for example for locating templates, defaults to CWD
            root: '<%= sourcePath %>/templates',
            // read frontmatter, defaults to true
            frontmatter: true,
            // Metalsmith plugins to use
            use: [
                metalsmithMarkdown(),
                metalsmithPath(),
                metalsmithLayouts({
                    'default': 'default.html',
                    engine: 'handlebars',
                    directory: '_layouts',
                    partials: '_includes',
                    data: {
                        version: pkg.version,
                    },
                }),
            ],
        }))
        .pipe(gulp.dest('<%= distributionPath %>'))
        .pipe(gulpif(isServeTask, browserSync.reload({
            stream: true,
        })));
});<% } %><% if (htmlJekyll) { %>

gulp.task('templates', function (gulpCallBack) {
    var spawn = require('child_process').spawn;
    var jekyll = spawn('bundler', [
        'exec',
        'jekyll',
        'build',
        '--source', '<%= sourcePath %>/templates',
        '--destination', '<%= distributionPath %>',
    ], {
        stdio: 'inherit',
    });

    jekyll.on('exit', function (code) {
        browserSync.reload();
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
});<% } %>

gulp.task('css', ['test-css'], function () {<% if (featureAutoprefixer) { %>
    var postcss = require('gulp-postcss');
    var autoprefixer = require('autoprefixer');
<% } %>
    return gulp.src('<%= sourcePath %>/css/main.scss')
        .pipe(gulpif(isDevMode, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: [
                '<%= sourcePath %>/libs/bower',
            ],
        }))<% if (featureAutoprefixer) { %>
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    'last 2 versions',
                ],
            }),
        ]))<% } %>
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, cssmin({
            aggressiveMerging: false,
        })))
        .pipe(gulp.dest('<%= distributionPath %>/resources/css'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.css',
        })))
        .on('error', function (error) {
            console.error('' + error);
        });
});<% if (featureModernizr) { %>

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
        .pipe(gulpif(!isDevMode, uglify()))
        .pipe(gulp.dest('<%= distributionPath %>/resources/js'))
});<% } %>

gulp.task('js', <% if (testESLint) { %>[
    'eslint',
], <% } %>function (<% if (moduleLoader == "webpack") { %>gulpCallback<% } %>) {<% if (moduleLoader == "webpack") { %>
        context: __dirname,
        entry: '<%= sourcePath %>/js/main.js',
        output: {
            path: '<%= distributionPath %>/resources/js/',
            filename: 'main.js',
        },
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: /(node_modules|<%= sourcePath %>\/libs\/bower)/,
                    loader: 'babel',
                },
            ],
        },
        resolve: {
            root: __dirname,
            modulesDirectories: [
                '<%= sourcePath %>/js',
                '<%= sourcePath %>/libs/bower',
                'node_modules',
            ],
        },
        resolveLoader: {
            root: path.join(__dirname, 'node_modules'),
        },
        plugins: [
            new webpack.ResolverPlugin(
                new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
            ),
        ],
        devtool: isDevMode ? 'sourcemap' : '',
    };

    if (!isDevMode) {
        myConfig.plugins = myConfig.plugins.concat(
            new webpack.optimize.UglifyJsPlugin()
        );
    }

    webpack(myConfig, function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }

        gutil.log('[webpack]', stats.toString({
            // output options
        }));

        browserSync.reload({
            match: '**/*.js',
        });

        callback();
    });<% } %><% if (moduleLoader == "none") { %>
    return gulp.src([
            '<%= sourcePath %>/js/module-a.js',
            '<%= sourcePath %>/js/main.js',
        ])
        .pipe(gulpif(isDevMode, sourcemaps.init()))<% if (transformJs) { %>
        .pipe(babel({
            modules: 'umd',
        }))<% } %>
        .pipe(concat('main.js'))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg
        })))
        .pipe(gulpif(!isDevMode, uglify({
            preserveComments: 'some',
        })))
        .pipe(gulp.dest('<%= distributionPath %>/resources/js'))
        .pipe(gulpif(isServeTask, browserSync.reload({
            match: '**/*.js',
        })))
        .on('error', function (error) {
            console.error('' + error);
        });<% } %>
});

gulp.task('fonts', function () {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= distributionPath %>/resources/fonts'))
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
            ],
        }))
        .pipe(gulp.dest('<%= distributionPath %>/resources/img'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.{gif,jpg,png,svg}'
        })))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('watch', function () {
    gulp.watch('<%= sourcePath %>/css/**/*.scss', ['css']);
    gulp.watch('<%= sourcePath %>/js/**/*.js', ['js']);
    gulp.watch('<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}', ['images']);<% if (htmlMetalsmith || htmlJekyll) { %>
    gulp.watch('<%= sourcePath %>/templates/**/*.html', function () {
        runSequence(
            'templates',
            [
                'css',
                'js',
                'fonts',
                'images',
            ]<% if (featureModernizr) { %>,
            'modernizr'<% } %>
        );
    });<% } %>
});

gulp.task('_serve', [
    'default',
    'watch',
], function () {
    browserSync({
        server: {
            baseDir: '<%= distributionPath %>'
        }
    });
});

gulp.task('serve', function () {
    isServeTask = true;

    if (typeof argv.target === 'undefined') {
        isDevMode = true;
    }

    runSequence('_serve');
});

gulp.task('default', ['clean'], function (cb) {
    runSequence(<% if (htmlMetalsmith || htmlJekyll) { %>
        'templates',<% } %>
        [
            'css',
            'js',
            'fonts',
            'images',
        ],<% if (featureModernizr) { %>
        'modernizr',<% } %>
        cb
    );
});
