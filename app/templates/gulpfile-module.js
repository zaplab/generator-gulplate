
import { argv } from 'yargs';
import del from 'del';
import gulp from 'gulp';<% if (transformJs) { %>
import babel from 'gulp-babel';<% } %>
import gulpif from 'gulp-if';
import sassLint from 'gulp-sass-lint';
import cssmin from 'gulp-cssmin';
import imagemin from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';
import eslint from 'gulp-eslint';
import uglify from 'gulp-uglify';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';
import runSequence from 'run-sequence';
import header from 'gulp-header';
import eventStream from 'event-stream';
import gutil from 'gulp-util';
import webpack from 'webpack';<% if (featureModernizr) { %>
import modernizr from 'gulp-modernizr';<% } %>

let isDevMode = false;
let isServeTask = false;
import pkg from './package.json';
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

function onWarning(error) {
    gutil.log(error);
}

function onError(error) {
    gutil.log(error);
    process.exit(1);
}

// Workaround for https://github.com/gulpjs/gulp/issues/71
let origSrc = gulp.src;

gulp.src = function () {
    return fixPipe(origSrc.apply(this, arguments));
};

function fixPipe(stream) {
    let origPipe = stream.pipe;
    stream.pipe = function (dest) {
        arguments[0] = dest.on('error', function (error) {
            let nextStreams = dest._nextStreams;

            if (nextStreams) {
                nextStreams.forEach(function (nextStream) {
                    nextStream.emit('error', error);
                });
            } else if (dest.listeners('error').length === 1) {
                throw error;
            }
        });

        let nextStream = fixPipe(origPipe.apply(this, arguments));
        (this._nextStreams || (this._nextStreams = [])).push(nextStream);

        return nextStream;
    };

    return stream;
}

// clear
gulp.task('clean', gulpCallback => {
    del([
        '<%= distributionPath %>/css',
        '<%= distributionPath %>/fonts',
        '<%= distributionPath %>/img',
        '<%= distributionPath %>/js',
    ]).then(() => {
        gulpCallback();
    });
});<% if (addDocumentation) { %>

gulp.task('clean:doc', gulpCallback => {
    del([
        '<%= documentationPath %>/resources/css/main.css.map',
        '<%= documentationPath %>/resources/js/main.js.map',
    ]).then(() => {
        gulpCallback();
    });
});<% } %>

gulp.task('eslint', () => {
    return gulp.src('<%= sourcePath %>/js/**/*.js')
        .pipe(eslint({
            configFile: '<%= testsPath %>/.eslintrc',
        }))
        .pipe(eslint.format())
        .on('error', onWarning);
});<% if (testKarma) { %>

// for easier debugging of the generated spec bundle
gulp.task('specs:debug', gulpCallback => {
    const webpackConfig = Object.assign({}, require('./webpack.config.js'), {
        context: __dirname,
        entry: '<%= testsPath %>/spec/main.js',
        output: {
            path: '<%= testsPath %>/spec-debug/',
            filename: 'bundle.js',
        },
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

gulp.task('specs', gulpCallback => {
    const KarmaServer = require('karma').Server;

    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
    }, karmaExitCode => {
        if (karmaExitCode !== 0) {
            process.exit(1);
        }

        gulpCallback();
    }).start();
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
]);
<% } %>
gulp.task('test-css', () => {
    return gulp.src([
            '<%= sourcePath %>/css/**/*.scss',<% if (addDocumentation) { %>
            '<%= sourcePath %>/doc/css/**/*.scss',<% } %>
        ])
        .pipe(sassLint({
            options: {
                'config-file': '<%= testsPath %>/.sass-lint.yml',
            },
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .on('error', onWarning);
});

gulp.task('test-js', [
    'eslint',<% if (testKarma) { %>
    'specs',<% } %>
]);

gulp.task('test', [
    'test-css',
    'test-js',
]);<% if (addDocumentation) { %>

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
            '<%= sourcePath %>/doc/templates/**/*.html',
            '!<%= sourcePath %>/doc/templates/_includes/**/*',
            '!<%= sourcePath %>/doc/templates/_layouts/**/*',
        ])
        .pipe(metalsmith({
            // set Metalsmith's root directory, for example for locating templates, defaults to CWD
            root: '<%= sourcePath %>/doc/templates',
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
        .pipe(gulp.dest('<%= documentationPath %>'))
        .pipe(gulpif(isServeTask, browserSync.reload({
            stream: true,
        })));
});<% } %>

gulp.task('html-minify', gulpCallback => {
    if (isDevMode) {
        gulpCallback();
    } else {
        const htmlmin = require('gulp-htmlmin');

        return gulp.src('<%= documentationPath %>/**/*.html')
            .pipe(htmlmin({
                minifyJS: true,
                minifyCSS: true,
                collapseWhitespace: true,
            }))
            .pipe(gulp.dest('<%= documentationPath %>'));
    }
});

gulp.task('copy:scss', () => {
    return gulp.src('<%= sourcePath %>/css/**/*.scss')
        .pipe(gulp.dest('<%= distributionPath %>/scss'))
        .on('error', onError);
});<% if (addDocumentation && featureModernizr) { %>

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
        .pipe(gulp.dest('<%= documentationPath %>/resources/js'))
        .on('error', onError);
});<% } %>

gulp.task('js', [
    'eslint',
], () => {
    return gulp.src('<%= sourcePath %>/js/**/*.js')<% if (transformJs) { %>
        .pipe(babel())<% } %>
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulp.dest('<%= distributionPath %>/js'))
        .on('error', onError);
});

gulp.task('fonts', () => {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= distributionPath %>/fonts'))
        .on('error', onError);
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
        .pipe(gulp.dest('<%= distributionPath %>/img'))
        .on('error', onError);
});<% if (addDocumentation) { %>

gulp.task('css:doc', [
    'test-css',
], () => {
    const postcss = require('gulp-postcss');
    const autoprefixer = require('autoprefixer');

    return gulp.src('<%= sourcePath %>/doc/css/main.scss')
        .pipe(gulpif(isDevMode, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: [
                'node_modules',
            ],
        }))
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    'last 2 versions',
                ],
            }),
        ]))
        .pipe(gulpif(isDevMode, sourcemaps.write('./')))
        .pipe(gulpif(!isDevMode, header(banner, {
            pkg: pkg,
        })))
        .pipe(gulpif(!isDevMode, cssmin({
            aggressiveMerging: false,
        })))
        .pipe(gulp.dest('<%= documentationPath %>/resources/css'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.css',
        })))
        .on('error', onError);
});

gulp.task('js:doc', [
    'eslint',
], gulpCallback => {
    const webpackConfig = Object.assign({}, require('./webpack.config.js'), {
        context: __dirname,
        entry: '<%= sourcePath %>/doc/js/main.js',
        output: {
            path: '<%= documentationPath %>/resources/js/',
            filename: 'main.js',
        },
        devtool: isDevMode ? 'sourcemap' : '',
    });

    if (!isDevMode) {
        webpackConfig.plugins = webpackConfig.plugins.concat(
            new webpack.optimize.UglifyJsPlugin()
        );
    }

    webpack(webpackConfig, (err, stats) => {
        if(err) throw new gutil.PluginError('webpack', err);

        gutil.log('[webpack]', stats.toString({
            // output options
        }));

        browserSync.reload({
            match: '**/*.js',
        });

        gulpCallback();
    });
});

gulp.task('fonts:doc', () => {
    return gulp.src('<%= sourcePath %>/fonts/**/*.{ttf,woff,eof,svg}')
        .pipe(gulp.dest('<%= documentationPath %>/resources/fonts'))
        .on('error', onError);
});

gulp.task('images:doc', () => {
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
        .pipe(gulp.dest('<%= documentationPath %>/resources/img'))
        .pipe(gulpif(isServeTask, browserSync.stream({
            match: '**/*.{gif,jpg,png,svg}'
        })))
        .on('error', onError);
});

gulp.task('watch', () => {
    gulp.watch([
        '<%= sourcePath %>/css/**/*.scss',
        '<%= sourcePath %>/doc/css/**/*.scss',
    ], ['css:doc']);
    gulp.watch([
        '<%= sourcePath %>/js/**/*.js',
        '<%= sourcePath %>/doc/js/**/*.js',
    ], ['js:doc']);
    gulp.watch([
        '<%= sourcePath %>/img/**/*.{gif,jpg,png,svg}',
        '<%= sourcePath %>/doc/img/**/*.{gif,jpg,png,svg}',
    ], ['images:doc']);
    gulp.watch('<%= sourcePath %>/doc/templates/**/*.html', () => {
        runSequence(
            'templates',
            [
                'css:doc',
                'js:doc',
                'fonts:doc',
                'images:doc',
            ]<% if (featureModernizr) { %>,
            'modernizr'<% } %>
        );
    });
});

gulp.task('doc', [
    'clean:doc',
], gulpCallback => {
    runSequence(
        'templates',
        'html-minify',
        [
            'css:doc',
            'js:doc',
            'fonts:doc',
            'images:doc',
        ],<% if (featureModernizr) { %>
        'modernizr',<% } %>
        gulpCallback
    );
});

gulp.task('_serve', [
    'doc',
    'watch',
], () => {
    browserSync({
        server: {
            baseDir: '<%= documentationPath %>',
        },
    });
});

gulp.task('serve', () => {
    isServeTask = true;

    if (typeof argv.target === 'undefined') {
        isDevMode = true;
    }

    runSequence('_serve');
});<% } %>

gulp.task('default', [
    'clean',
], gulpCallback => {
    runSequence(
        [
            'test-css',
            'copy:scss',
            'js',
            'fonts',
            'images',
        ],
        gulpCallback
    );
});
