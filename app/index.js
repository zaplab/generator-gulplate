'use strict';

var yeoman = require('yeoman-generator'),
    chalk = require('chalk');

module.exports = yeoman.generators.Base.extend({
    constructor: function ()
    {
        yeoman.generators.Base.apply(this, arguments);

        this.argument('project-name', {
            type: String,
            required: false
        });
        this.projectName = this['project-name'] || 'project-name';
        this.projectName = this._.slugify(this.projectName);

        this.option('skip-install', {
            type: Boolean,
            desc: 'Skip the npm installations',
            defaults: false
        });

        this.addDocumentation = false;
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

    prompTransformJs: function ()
    {
        this.transformJs = true;

        if (this.projectType === 'module') {
            var done = this.async();

            this.prompt({
                type: 'confirm',
                name: 'transformJs',
                message: 'Transform JS to ES5?',
                default: true,
            }, function (answers) {
                this.transformJs = answers.transformJs;
                this.config.set('transformJs', this.transformJs);

                done();
            }.bind(this));
        }
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
                    name: 'Karma & Jasmine',
                    value: 'karma',
                    checked: true
                }
            ]
        }, function (answers) {
            var features = answers.tests;

            this.testKarma = hasFeature(features, 'karma');
            this.config.set('testKarma', this.testKarma);

            done();
        }.bind(this));
    },

    promptTestsPath: function ()
    {
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
            this.featureModernizr = hasFeature(features, 'modernizr');
            this.config.set('featureModernizr', this.featureModernizr);

            done();
        }.bind(this));
    },

    writing: {
        babel: function () {
            this.copy('babelrc', '.babelrc');
        },

        sasslint: function () {
            this.copy('tests/sass-lint.yml', '.sass-lint.yml');
        },

        editorConfig: function () {
            this.copy('editorconfig', '.editorconfig');
        },

        git: function () {
            this.template('gitattributes', '.gitattributes');
            this.template('gitignore', '.gitignore');
        },

        gulpfile: function () {
            if (this.projectType === 'website') {
                this.copy('gulpfile-website.js', 'gulpfile.babel.js');
            } else {
                this.copy('gulpfile-module.js', 'gulpfile.babel.js');
            }
        },

        eslint: function () {
            this.copy('tests/eslintrc', '.eslintrc');
        },

        modules: function () {
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
                    devDependencies: {},
                },
                gulpModules = {
                    autoprefixer: '^6.3.6',
                    'babel-core': '^6.7.0',
                    "babel-plugin-add-module-exports": "^0.1.2",
                    "babel-plugin-transform-async-to-generator": "6.7.0",
                    "babel-plugin-transform-class-properties": "6.6.0",
                    "babel-plugin-transform-es2015-destructuring": "6.6.5",
                    "babel-plugin-transform-es2015-function-name": "6.5.0",
                    "babel-plugin-transform-es2015-modules-commonjs": "6.7.0",
                    "babel-plugin-transform-es2015-parameters": "6.7.0",
                    "babel-plugin-transform-es2015-spread": "6.6.5",
                    "babel-plugin-transform-es2015-sticky-regex": "6.5.0",
                    "babel-plugin-transform-es2015-unicode-regex": "6.5.0",
                    "babel-plugin-transform-object-rest-spread": "6.6.5",
                    'babel-plugin-transform-object-assign': '^6.5.0',
                    'babel-preset-es2015': '^6.6.0',
                    'babel-preset-stage-0': '^6.5.0',
                    'babel-eslint': '^6.0.4',
                    'eslint-config-airbnb': '^8.0.0',
                    'eslint-plugin-react': '^5.0.1',
                    'cssnano': '^3.7.3',
                    'eslint-plugin-import': '^1.6.1',
                    'eslint-plugin-jsx-a11y': '^1.0.4',
                    'gulp-eslint': '^2.0.0',
                    'breakpoint-sass': '^2.7.0',
                    'compass-mixins': '^0.12.7',
                    del: '^2.2.0',
                    'event-stream': '^3.3.2',
                    gulp: '^3.9.1',
                    'gulp-babel': '^6.1.2',
                    'gulp-util': '^3.0.7',
                    'gulp-header': '^1.7.1',
                    'gulp-htmlmin': '^1.3.0',
                    'gulp-if': '^2.0.0',
                    'gulp-imagemin': '^2.4.0',
                    'gulp-postcss': '^6.1.0',
                    'gulp-sass': '^2.2.0',
                    'gulp-sass-lint': '^1.1.1',
                    'gulp-sourcemaps': '^1.6.0',
                    'gulp-uglify': '^1.5.3',
                    'imagemin-pngquant': '^4.2.2',
                    'node-sass': '3.4.2',
                    'run-sequence': '^1.1.5',
                    susy: '^2.2.12',
                    yargs: '^4.4.0',
                    'babel-loader': '^6.2.4',
                    webpack: '^1.13.0',
                },
                key;

            for (key in gulpModules) {
                if (gulpModules.hasOwnProperty(key)) {
                    packageJSON.devDependencies[key] = gulpModules[key];
                }
            }

            packageJSON.devDependencies['gulp-metalsmith'] = '^1.0.0';
            packageJSON.devDependencies['metalsmith-markdown'] = '^0.2.1';
            packageJSON.devDependencies['metalsmith-path'] = '^0.2.0';
            packageJSON.devDependencies['metalsmith-layouts'] = '^1.6.4';
            packageJSON.devDependencies['handlebars'] = '^4.0.5';

            if (this.projectType === 'module') {
                packageJSON.main = this.distributionPath + '/js/main.js';
            }

            if ((this.projectType === 'website') || this.addDocumentation) {
                packageJSON.devDependencies['browser-sync'] = '^2.11.1';
            }

            if (this.addDocumentation) {
                packageJSON.devDependencies['prismjs'] = '^1.4.1';
            }

            if (this.testKarma) {
                packageJSON.devDependencies['phantomjs'] = '^1.9.20';
                packageJSON.devDependencies['karma'] = '^0.13.22';
                packageJSON.devDependencies['karma-jasmine'] = '^0.3.8';
                packageJSON.devDependencies['karma-phantomjs-launcher'] = '^0.2.3';
                packageJSON.devDependencies['karma-spec-reporter'] = '^0.0.25';
                packageJSON.devDependencies['karma-webpack'] = '^1.7.0';

                packageJSON.devDependencies['jasmine'] = '^2.4.1 ';
                packageJSON.devDependencies['jasmine-ajax'] = '^3.2.0';
                packageJSON.devDependencies['jasmine-expect'] = '^2.0.2';

                packageJSON.devDependencies['es5-shim'] = '^4.5.7';

                packageJSON.scripts = {
                    test: 'karma start',
                };
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
        },

        doc: function () {
            if (this.addDocumentation) {
                this.copy('src/doc/css/main.scss', this.sourcePath + '/doc/css/main.scss');
                this.copy('src/doc/js/main.js', this.sourcePath + '/doc/js/main.js');
            }
        },

        templates: function () {
            var extraPath = '';

            if (this.addDocumentation) {
                extraPath = '/doc';
            }

            this.copy('src/templates/index.html', this.sourcePath + extraPath + '/templates/index.html');
            this.copy('src/templates/subpage.html', this.sourcePath + extraPath + '/templates/subpage.html');
            this.copy('src/templates/_layouts/default.html', this.sourcePath + extraPath + '/templates/_layouts/default.html');
            this.copy('src/templates/_includes/main-navigation.html', this.sourcePath + extraPath + '/templates/_includes/main-navigation.html');
        },

        webpack: function () {
            this.copy('webpack.config.js');
        },

        test: function () {
            if (this.testKarma) {
                this.mkdir(this.testsPath + '/spec');
                this.copy('tests/spec/_basic.js', this.testsPath + '/spec/_basic.js');
                this.copy('tests/spec/main.js', this.testsPath + '/spec/main.js');
                this.copy('tests/specs.html', this.testsPath + '/specs.html');
                this.copy('karma.conf.js');
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

            this.log(installInfo);
            this.log('Then:\n> ' + chalk.yellow.bold('gulp serve'));
        } else {
            this.installDependencies({
                bower: false,
            });
        }
    }
});