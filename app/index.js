'use strict';

var yeoman = require('yeoman-generator'),
    chalk = require('chalk');

module.exports = yeoman.generators.Base.extend({
    constructor: function ()
    {
        // Calling the super constructor is important so our generator is correctly set up
        yeoman.generators.Base.apply(this, arguments);

        this.argument('project-name', {
            type: String,
            required: false
        });
        this.projectName = this['project-name'] || 'project-name';
        this.projectName = this._.slugify(this.projectName);

        // settings:
        this.option('settings-min-files', {
            type: Boolean,
            desc: 'Generate extra .min files for css & js files. Or just minify without extra file.',
            defaults: false
        });

        this.option('settings-documentation', {
            type: Boolean,
            desc: 'Add Documentation (Jekyll)',
            defaults: false
        });

        this.option('settings-tests', {
            type: Boolean,
            desc: 'Add Tests (CSS Lint, ESLint and Mocha & Chai)',
            defaults: true
        });

        this.option('skip-install', {
            type: Boolean,
            desc: 'Skip the bower, node and maybe gem installations',
            defaults: false
        });

        this.htmlMetalsmith = false;
        this.htmlJekyll = false;

        this.addDocumentation = false;

        this.docMetalsmith = false;
        this.docJekyll = false;
    },

    promptProjectName: function ()
    {
        if (!this['project-name']) {
            var done = this.async();

            this.prompt({
                type: 'input',
                name: 'name',
                message: 'Project Name',
                default: this.projectName
            }, function (answers) {
                this.projectName = answers.name;
                this.projectName = this._.slugify(this.projectName);
                this.config.set('projectName', this.projectName);

                done();
            }.bind(this));
        }
    },

    promptProjectType: function ()
    {
        var done = this.async(),
            prompts = {
                type: 'list',
                name: 'type',
                message: 'Project Type:',
                choices: [
                    {
                        name: 'Website',
                        value: 'website'
                    },
                    {
                        name: 'Module/Plugin/Library',
                        value: 'module'
                    }
                ],
                default: 'website'
            };

        this.prompt(prompts, function (answers) {
            this.projectType = answers['type'];
            this.config.set('type', this.projectType);

            done();
        }.bind(this));
    },

    prompHTML: function ()
    {
        if (this.projectType === 'website') {
            var done = this.async();

            this.prompt({
                type: 'list',
                name: 'html',
                message: 'HTML Template',
                choices: [
                    {
                        name: 'Basic index.html',
                        value: 'basic'
                    },
                    {
                        name: 'Use Metalsmith (node)',
                        value: 'metalsmith'
                    },
                    {
                        name: 'Use Jekyll (ruby)',
                        value: 'jekyll'
                    }
                ],
                default: 'basic'
            }, function (answers) {
                this.htmlBasic = (answers.html === 'basic');
                this.htmlMetalsmith = (answers.html === 'metalsmith');
                this.htmlJekyll = (answers.html === 'jekyll');
                this.config.set('htmlBasic', this.htmlBasic);
                this.config.set('htmlMetalsmith', this.htmlMetalsmith);
                this.config.set('htmlJekyll', this.htmlJekyll);

                done();
            }.bind(this));
        }
    },

    prompTransformJs: function ()
    {
        var done = this.async();

        this.prompt({
            type: 'confirm',
            name: 'transformJs',
            message: 'Transform ES6 to ES5?',
            default: (this.projectType === 'website') ? true : false
        }, function (answers) {
            this.transformJs = answers.transformJs;
            this.config.set('transformJs', this.transformJs);

            done();
        }.bind(this));
    },

    promptSourcePathName: function ()
    {
        var done = this.async();

        this.prompt({
            type: 'input',
            name: 'src-path',
            message: 'Source Path',
            default: 'src'
        }, function (answers) {
            this.sourcePath = answers['src-path'];
            this.sourcePath = this._.slugify(this.sourcePath);
            this.config.set('sourcePath', this.sourcePath);

            done();
        }.bind(this));
    },

    promptDistributionPathName: function ()
    {
        var done = this.async();

        this.prompt({
            type: 'input',
            name: 'dist-path',
            message: 'Distribution Path',
            default: 'dist'
        }, function (answers) {
            this.distributionPath = answers['dist-path'];
            this.distributionPath = this._.slugify(this.distributionPath);
            this.config.set('distributionPath', this.distributionPath);

            done();
        }.bind(this));
    },

    prompAddDocumentation: function ()
    {
        if (this.projectType === 'module') {
            var done = this.async();

            this.prompt({
                type: 'confirm',
                name: 'documentation',
                message: 'Add Documentation',
                default: true
            }, function (answers) {
                this.addDocumentation = answers.documentation;
                this.config.set('addDocumentation', this.addDocumentation);

                done();
            }.bind(this));
        }
    },

    promptDocumentationPathName: function ()
    {
        if (this.addDocumentation) {
            var done = this.async();

            this.prompt({
                type: 'input',
                name: 'doc-path',
                message: 'Documentation Path',
                default: 'doc'
            }, function (answers) {
                this.documentationPath = answers['doc-path'];
                this.documentationPath = this._.slugify(this.documentationPath);
                this.config.set('docPath', this.documentationPath);

                done();
            }.bind(this));
        }
    },

    promptDocumentationFramework: function ()
    {
        if (this.addDocumentation) {
            var done = this.async();

            this.prompt({
                type: 'list',
                name: 'doc-framework',
                message: 'Documentation Site-Generator',
                choices: [
                    {
                        name: 'Metalsmith (node)',
                        value: 'metalsmith'
                    },
                    {
                        name: 'Jekyll (ruby)',
                        value: 'jekyll'
                    }
                ],
                default: 'metalsmith'
            }, function (answers) {
                this.docMetalsmith = (answers['doc-framework'] === 'metalsmith');
                this.docJekyll = (answers['doc-framework'] === 'jekyll');
                this.config.set('docMetalsmith', this.docMetalsmith);
                this.config.set('docJekyll', this.docJekyll);

                done();
            }.bind(this));
        }
    },

    prompTestSettings: function ()
    {
        var done = this.async(),
            hasFeature = function (features, feature) {
                return features.indexOf(feature) !== -1;
            };

        this.prompt({
            type: 'checkbox',
            name: 'tests',
            message: 'Tests',
            choices: [
                {
                    name: 'SASS Lint',
                    value: 'sasslint',
                    checked: true
                },
                {
                    name: 'ESLint',
                    value: 'eslint',
                    checked: true
                },
                {
                    name: 'Mocha & Chai',
                    value: 'mocha',
                    checked: true
                }
            ]
        }, function (answers) {
            var features = answers.tests;

            this.testSassLint = hasFeature(features, 'sasslint');
            this.testESLint = hasFeature(features, 'eslint');
            this.testMocha = hasFeature(features, 'mocha');
            this.config.set('testSassLint', this.testSassLint);
            this.config.set('testESLint', this.testESLint);
            this.config.set('testMocha', this.testMocha);

            done();
        }.bind(this));
    },

    promptTestsPath: function ()
    {
        if (this.testSassLint || this.testESLint || this.testMocha) {
            var done = this.async();

            this.prompt({
                type: 'input',
                name: 'tests-path',
                message: 'Tests Path',
                default: 'tests'
            }, function (answers) {
                this.testsPath = answers['tests-path'];
                this.testsPath = this._.slugify(this.testsPath);
                this.config.set('testsPath', this.testsPath);

                done();
            }.bind(this));
        }
    },

    promptModuleLoaders: function ()
    {
        if (this.addDocumentation || (this.projectType === 'website')) {
            var done = this.async(),
                prompts = {
                    type: 'list',
                    name: 'module-loader',
                    message: (this.addDocumentation && (this.projectType === 'module')) ? 'Module Loader for Documentation:' : 'Module Loader:',
                    choices: [
                        {
                            name: 'None',
                            value: 'none'
                        }, /*, // TODO
                         {
                         name: 'jspm',
                         value: 'jspm'
                         },*/
                        {
                            name: 'Require.js',
                            value: 'requirejs'
                        },
                        {
                            name: 'Webpack',
                            value: 'webpack'
                        }
                    ],
                    default: 'webpack'
                };

            this.prompt(prompts, function (answers) {
                this.moduleLoader = answers['module-loader'];
                this.config.set('module-loader', this.moduleLoader);

                done();
            }.bind(this));
        } else {
            this.moduleLoader = 'none';
        }
    },

    promptFeatures: function ()
    {
        var done = this.async(),
            prompts = {
                type: 'checkbox',
                name: 'features',
                message: 'Extras',
                choices: [
                    {
                        name: 'Use Autoprefixer',
                        value: 'autoprefixer',
                        checked: true
                    },
                    {
                        name: 'Use Modernizr',
                        value: 'modernizr',
                        checked: true
                    }
                ]
            },
            hasFeature = function (features, feature) {
                return features.indexOf(feature) !== -1;
            };

        this.log('By default breakpoint-sass, compass-mixins and susy2-grid are included.');

        this.prompt(prompts, function (answers) {
            var features = answers.features;
            this.featureAutoprefixer = hasFeature(features, 'autoprefixer');
            this.featureModernizr = hasFeature(features, 'modernizr');
            this.config.set('featureAutoprefixer', this.featureAutoprefixer);
            this.config.set('featureModernizr', this.featureModernizr);

            done();
        }.bind(this));
    },

    writing: {
        bower: function () {
            var bower = {
                name: this._.slugify(this.projectName),
                'private': true,
                dependencies: {
                    'compass-breakpoint': '^2.6.1',
                    'compass-mixins': '^0.12.7',
                    susy: '^2.2.6'
                },
                devDependencies: {}
            };

            if (this.moduleLoader == 'requirejs') {
                bower.dependencies.requirejs = '^2.1.15';
            }

            if (this.testMocha) {
                bower.devDependencies.chai = '^1.10.0';
                bower.devDependencies.mocha = '^2.1.0';
            }

            if (this.addDocumentation) {
                bower.devDependencies['google-code-prettify'] = '^1.0.4';
            }

            this.copy('bowerrc', '.bowerrc');
            this.write('bower.json', JSON.stringify(bower, null, 2));
        },

        sasslint: function () {
            if (this.testSassLint) {
                this.copy('tests/sass-lint.yml', this.testsPath + '/.sass-lint.yml');
            }
        },

        editorConfig: function () {
            this.copy('editorconfig', '.editorconfig');
        },

        gem: function () {
            if (this.htmlJekyll || this.docJekyll) {
                this.template('Gemfile');
            }
        },

        git: function () {
            this.template('gitignore', '.gitignore');
        },

        gulpfile: function () {
            if (this.projectType === 'website') {
                this.copy('gulpfile-website.js', 'gulpfile.js');
            } else {
                this.copy('gulpfile-module.js', 'gulpfile.js');
            }
        },

        eslint: function () {
            if (this.testESLint) {
                this.copy('tests/eslintrc', this.testsPath + '/.eslintrc');
            }
        },

        modules: function () {
            if (this.moduleLoader == 'requirejs') {
                this.mkdir(this.sourcePath + '/js/config');
                this.copy('src/js/config/requirejs.js', this.sourcePath + '/js/config/requirejs.js');
            }

            this.copy('src/js/module-a.js', this.sourcePath + '/js/module-a.js');
        },

        packageJSON: function () {
            var packageJSON = {
                    name: this._.slugify(this.projectName),
                    private: true,
                    version: '0.0.0',
                    author: {
                        name : 'Author Name',
                        email : 'author@email',
                        url : 'http://www.author.url'
                    },
                    dependencies: {},
                    devDependencies: {
                        bower: '^1.4.1'
                    }
                },
                gulpModules = {
                    del: '^1.2.0',
                    'event-stream': '^3.3.1',
                    gulp: '^3.9.0',
                    'gulp-util': '^3.0.6',
                    'gulp-concat': '^2.6.0',
                    'gulp-cssmin': '^0.1.7',
                    'gulp-header': '^1.2.2',
                    'gulp-if': '^1.2.5',
                    'gulp-imagemin': '^2.3.0',
                    'gulp-sass': '^2.0.3',
                    'gulp-sourcemaps': '^1.5.2',
                    'gulp-uglify': '^1.2.0',
                    'imagemin-pngquant': '^4.1.0',
                    'run-sequence': '^1.1.1',
                    yargs: '^3.14.0'
                },
                key;

            for (key in gulpModules) {
                if (gulpModules.hasOwnProperty(key)) {
                    packageJSON.devDependencies[key] = gulpModules[key];
                }
            }

            if (this.projectType === 'module') {
                packageJSON.main = this.distributionPath + '/js/main.js';
            }

            if (this.transformJs) {
                packageJSON.devDependencies['gulp-babel'] = '^5.2.1';
            }

            if (this.testSassLint) {
                packageJSON.devDependencies['gulp-sass-lint'] = '^1.0.1';
            }

            if (this.testESLint) {
                packageJSON.devDependencies['babel-eslint'] = '^4.0.10';
                packageJSON.devDependencies['eslint-plugin-react'] = '^3.4.2';
                packageJSON.devDependencies['eslint-config-airbnb'] = '^0.0.8';

                packageJSON.devDependencies['gulp-eslint'] = '^1.0.0';
            }

            if (this.moduleLoader == 'requirejs') {
                packageJSON.devDependencies['gulp-requirejs-optimize'] = '^0.1.3';
            }

            if (this.moduleLoader == 'webpack') {
                packageJSON.devDependencies['babel-core'] = '^5.8.25';
                packageJSON.devDependencies['babel-loader'] = '^5.3.2';
                packageJSON.devDependencies['webpack'] = '^1.12.2';
            }

            if ((this.projectType === 'website') || this.addDocumentation) {
                packageJSON.devDependencies['browser-sync'] = '^2.9.3';
            }

            if (this.htmlMetalsmith || this.docMetalsmith) {
                packageJSON.devDependencies['gulp-metalsmith'] = '0.0.3';
                packageJSON.devDependencies['metalsmith-markdown'] = '^0.2.1';
                packageJSON.devDependencies['metalsmith-path'] = '^0.1.0';
                packageJSON.devDependencies['metalsmith-layouts'] = '^1.4.2';
                packageJSON.devDependencies['handlebars'] = '^4.0.4';
            }

            if (this.testMocha) {
                packageJSON.devDependencies['gulp-connect'] = '^2.2.0';
                packageJSON.devDependencies['gulp-mocha-phantomjs'] = '^0.9.0';
                packageJSON.scripts = {
                    postinstall: './node_modules/.bin/gulp setup'
                };
            }

            if (this.featureAutoprefixer) {
                packageJSON.devDependencies['autoprefixer'] = '^6.1.0';
                packageJSON.devDependencies['gulp-postcss'] = '^6.0.1';
            }

            if (this.featureModernizr) {
                packageJSON.devDependencies['gulp-modernizr'] = '^1.0.0-alpha';
            }

            this.write('package.json', JSON.stringify(packageJSON, null, 2));
        },

        source: function () {
            this.mkdir(this.sourcePath);
            this.mkdir(this.sourcePath + '/css');
            this.mkdir(this.sourcePath + '/fonts');
            this.mkdir(this.sourcePath + '/img');
            this.mkdir(this.sourcePath + '/js');

            this.copy('src/js/main.js', this.sourcePath + '/js/main.js');

            this.copy('src/css/_functions.scss', this.sourcePath + '/css/_functions.scss');
            this.copy('src/css/_mixins.scss', this.sourcePath + '/css/_mixins.scss');
            this.copy('src/css/_variables.scss', this.sourcePath + '/css/_variables.scss');
            this.copy('src/css/main.scss', this.sourcePath + '/css/main.scss');
        },

        dist: function () {
            this.mkdir(this.distributionPath);

            if (this.htmlBasic) {
                this.copy('src/index.html', this.distributionPath + '/index.html');
            }
        },

        doc: function () {
            if (this.addDocumentation) {
                this.copy('src/doc/css/main.scss', this.sourcePath + '/doc/css/main.scss');
                this.copy('src/doc/js/main.js', this.sourcePath + '/doc/js/main.js');
            }
        },

        jekyll: function () {
            var extraPath = '';

            if (this.htmlMetalsmith || this.htmlJekyll || this.addDocumentation) {
                if (this.addDocumentation) {
                    extraPath = '/doc';
                }

                if (this.htmlMetalsmith || this.docMetalsmith) {
                    this.copy('src/templates/metalsmith/index.html', this.sourcePath + extraPath + '/templates/index.html');
                    this.copy('src/templates/metalsmith/subpage.html', this.sourcePath + extraPath + '/templates/subpage.html');
                    this.copy('src/templates/metalsmith/_layouts/default.html', this.sourcePath + extraPath + '/templates/_layouts/default.html');
                    this.copy('src/templates/metalsmith/_includes/main-navigation.html', this.sourcePath + extraPath + '/templates/_includes/main-navigation.html');
                } else if (this.htmlJekyll || this.docJekyll) {
                    this.copy('src/templates/jekyll/index.html', this.sourcePath + extraPath + '/templates/index.html');
                    this.copy('src/templates/jekyll/subpage.html', this.sourcePath + extraPath + '/templates/subpage.html');
                    this.copy('src/templates/jekyll/_layouts/default.html', this.sourcePath + extraPath + '/templates/_layouts/default.html');
                    this.copy('src/templates/jekyll/_includes/main-navigation.html', this.sourcePath + extraPath + '/templates/_includes/main-navigation.html');
                    this.copy('src/templates/jekyll/_config.yml', this.sourcePath + extraPath + '/templates/_config.yml');
                }
            }
        },

        test: function () {
            if (this.testMocha) {
                this.mkdir(this.testsPath + '/unit');
                this.copy('tests/unit/basic.js', this.testsPath + '/unit/basic.js');

                if (this.moduleLoader == 'requirejs') {
                    this.mkdir(this.testsPath + '/unit/requirejs');
                    this.copy('tests/unit/requirejs/_main.js', this.testsPath + '/unit/requirejs/_main.js');
                    this.copy('tests/unit/requirejs/basic.js', this.testsPath + '/unit/requirejs/basic.js');
                    this.copy('tests/unit/basic.js', this.testsPath + '/unit/basic.js');

                    if (this.projectType === 'website') {
                        this.copy('tests/index-requirejs.html', this.testsPath + '/index.html');
                    } else {
                        this.copy('tests/index.html', this.testsPath + '/index.html');
                        this.copy('tests/index-requirejs.html', this.testsPath + '/index-requirejs.html');
                    }
                } else {
                    this.copy('tests/index.html', this.testsPath + '/index.html');
                }
            }
        }
    },

    install: function ()
    {
        if (this.options['skip-install']) {
            var installInfo = 'To install:\n> ' + chalk.yellow.bold('npm install');

            if (this.testMocha) {
                installInfo += chalk.yellow.bold('gulp setup');
            }

            if (this.htmlJekyll || this.docJekyll) {
                installInfo += chalk.yellow.bold(' && bundler install');
            }

            this.log(installInfo);
            this.log('Then:\n> ' + chalk.yellow.bold('gulp serve'));
        } else {
            this.installDependencies({
                callback: function () {
                    if (this.htmlJekyll || this.docJekyll) {
                        this.spawnCommand('bundler', ['install']);
                    }
                }.bind(this)
            });
        }
    }
});