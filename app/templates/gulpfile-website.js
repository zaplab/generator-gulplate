
'use strict';

const argv = require('yargs').argv;
const del = require('del');
const gulp = require('gulp');<% if (transformJs) { %>
const babel = require('gulp-babel');<% } %>
const gulpif = require('gulp-if');
const concat = require('gulp-concat');<% if (testSassLint) { %>
const sassLint = require('gulp-sass-lint');<% } %>
const cssmin = require('gulp-cssmin');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');<% if (testESLint) { %>
const eslint = require('gulp-eslint');<% } %>
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const runSequence = require('run-sequence');
const header = require('gulp-header');
const eventStream = require('event-stream');<% if ((moduleLoader == "webpack") || testKarma) { %>
const gutil = require('gulp-util');
const webpack = require('webpack');<% } %><% if (featureModernizr) { %>
const modernizr = require('gulp-modernizr');<% } %>
const path = require('path');

let isDevMode = false;
let isServeTask = false;
let pkg = require('./package.json');
const banner = [
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
gulp.task('clean', gulpCallback => {
    del([
        '<%= distributionPath %>/resources/css/main.css.map',
        '<%= distributionPath %>/resources/fonts',
        '<%= distributionPath %>/resources/img',
        '<%= distributionPath %>/resources/js/main.js.map',
    ].then(paths => {
        gulpCallback();
    });
});<% if (testESLint) { %>

gulp.task('eslint', () => {
    return gulp.src('<%= sourcePath %>/js/**/*.js')
        .pipe(eslint({
            configFile: '<%= testsPath %>/.eslintrc',
        }))
        .pipe(eslint.format())
        .on('error', error => {
            console.error('' + error);
        });
});<% } %><% if (testKarma) { %>

// for easier debugging of the generated spec bundle
gulp.task('specs:debug', gulpCallback => {
    let webpackConfig = Object.assign({}, require('./webpack.config.js'), {
        context: __dirname,
        entry: '<%= testsPath %>/spec/main.js',
        output: {
            path: '<%= testsPath %>/spec-debug/',
            filename: 'bundle.js',
        }
    });

    webpack(webpackConfig, (err, stats) => {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }

        gutil.log('[webpack]', stats.toString({
            // output options
        }));

        browserSync.reload({
            match: '**/*.js',
        });

        gulpCallback();
    });
});

gulp.task('specs', done => {
    let KarmaServer = require('karma').Server;

    new KarmaServer.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
    }, () => {
        done();
    });
});

gulp.task('setup-tests', gulpCallback => {
    eventStream.concat(
        // jasmine
        gulp.src([
                'node_modules/jasmine-core/lib/jasmine-core/jasmine.css',
                'node_modules/jasmine-core/lib/jasmine-core/boot.js',
                'node_modules/jasmine-core/lib/jasmine-core/jasmine.js',
                'node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js',
            ])
            .pipe(gulp.dest('<%= testsPath %>/libs')),
        // jasmine-expect
        gulp.src('node_modules/jasmine-expect/dist/jasmine-matchers.js')
            .pipe(gulp.dest('<%= testsPath %>/libs')),
        // es5-shim
        gulp.src('node_modules/es5-shim/es5-shim.js')
            .pipe(gulp.dest('<%= testsPath %>/libs'))
    ).on('end', gulpCallback);
});

gulp.task('setup', [
    'setup-tests',
]);<% } %><% if (testSassLint) { %>

gulp.task('test-css', () => {
    return gulp.src('<%= sourcePath %>/css/**/*.scss')
        .pipe(sassLint({
            options: {
                'config-file': '<%= testsPath %>/.sass-lint.yml',
            },
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .on('error', error => {
            console.error('' + error);
        });
});<% } %>

gulp.task('test-js', [<% if (testESLint) { %>
    'eslint',<% } %><% if (testKarma) { %>
    'specs',<% } %>
]);

gulp.task('test', [
    <% if (testSassLint) { %>'test-css',<% } %>
    'test-js',
]);<% if (htmlMetalsmith) { %>

gulp.task('templates', () => {
    const metalsmith = require('gulp-metalsmith');
    const metalsmithMarkdown = require('metalsmith-markdown');
    const metalsmithPath = require('metalsmith-path');
    const metalsmithLayouts = require('metalsmith-layouts');
    const handlebars = require('handlebars');

    handlebars.registerHelper('if_eq', (a, b, opts) => {
        if (a == b) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
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

gulp.task('templates', gulpCallback => {
    const spawn = require('child_process').spawn;
    const jekyll = spawn('bundler', [
        'exec',
        'jekyll',
        'build',
        '--source', '<%= sourcePath %>/templates',
        '--destination', '<%= distributionPath %>',
    ], {
        stdio: 'inherit',
    });

    jekyll.on('exit', code => {
        browserSync.reload();
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
});<% } %>

gulp.task('css', ['test-css'], () => {<% if (featureAutoprefixer) { %>
    const postcss = require('gulp-postcss');
    const autoprefixer = require('autoprefixer');
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
        .on('error', error => {
            console.error('' + error);
        });
});<% if (featureModernizr) { %>

gulp.task('modernizr', () => {
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
], <% } %>(<% if (moduleLoader == "webpack") { %>gulpCallback<% } %>) => {<% if (moduleLoader == "webpack") { %>
    let webpackConfig = {
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
        webpackConfig.plugins = webpackConfig.plugins.concat(
            new webpack.optimize.UglifyJsPlugin()
        );
    }

    webpack(webpackConfig, (err, stats) => {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }

        gutil.log('[webpack]', stats.toString({
            // output options
        }));

        browserSync.reload({
            match: '**/*.js',
        });

        gulpCallback();
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
        .on('error', error => {
            console.error('' + error);
        });<% } %>
});

gulp.task('fonts', () => {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= distributionPath %>/resources/fonts'))
        .on('error', error => {
            console.error('' + error);
        });
});

gulp.task('images', () => {
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
        .on('error', error => {
            console.error('' + error);
        });
});

gulp.task('watch', () => {
    gulp.watch('<%= sourcePath %>/css/**/*.scss', ['css']);
    gulp.watch('<%= sourcePath %>/js/**/*.js', ['js']);
    gulp.watch('<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}', ['images']);<% if (htmlMetalsmith || htmlJekyll) { %>
    gulp.watch('<%= sourcePath %>/templates/**/*.html', () => {
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
], () => {
    browserSync({
        server: {
            baseDir: '<%= distributionPath %>'
        }
    });
});

gulp.task('serve', () => {
    isServeTask = true;

    if (typeof argv.target === 'undefined') {
        isDevMode = true;
    }

    runSequence('_serve');
});

gulp.task('default', ['clean'], gulpCallback => {
    runSequence(<% if (htmlMetalsmith || htmlJekyll) { %>
        'templates',<% } %>
        [
            'css',
            'js',
            'fonts',
            'images',
        ],<% if (featureModernizr) { %>
        'modernizr',<% } %>
        gulpCallback
    );
});
