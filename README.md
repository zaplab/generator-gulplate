generator-gulplate
=========

yeoman generator for the basic structure of a web project with a gulp template

## Usage

```
$ mkdir my-project && cd $_
```

then run this yeoman generator

```
$ yo gulplate
```

## What you get

```
$ gulp
$ gulp serve
```

```
$ gulp css
$ gulp images
$ gulp js
$ gulp fonts
```

your choices:

1. Project Name (project-name)

2. Project Type
  - Website
  - Module/Plugin/Library

### If Project-Type is "Website":

get a dummy html template (index.html) in dist

```
.
├── dist
│   ├── resources
│   │   ├── css
│   │   ├── fonts
│   │   ├── img
│   │   └── js
│   └── index.html
├── src
│   ├── css
│   │   ├── _functions.scss
│   │   ├── _mixins.scss
│   │   ├── _variables.scss
│   │   └── main.scss
│   ├── fonts
│   ├── img
│   ├── js
│   │   ├── main.js
│   │   └── module-a.js
│   └── libs
│       └── bower
├── tests
│   ├── .jshintrc
│   └── sass-lint.yml
├── .bowerrc
├── .editorconfig
├── .gitignore
├── bower.json
├── gulpfile.js
└── package.json
```

or instead of the dummy index.html you can also use metalsmith (node) or jekyll (ruby) as static site builders.
the following folders / files will be added

```
.
├── src
│   └── templates
│       ├── _includes
│       │   └── main-navigation.html
│       ├── _layouts
│       │   └── default.html
│       ├── index.html
│       └── subpage.html
└── [Gemfile]
```

### If Project-Type is "Module/Plugin/Library":

```
.
├── dist
│   ├── css
│   ├── fonts
│   ├── img
│   └── js
├── src
│   ├── css
│   │   ├── _functions.scss
│   │   ├── _mixins.scss
│   │   ├── _variables.scss
│   │   └── main.scss
│   ├── fonts
│   ├── img
│   ├── js
│   │   ├── main.js
│   │   └── module-a.js
│   └── libs
│       └── bower
├── tests
│   ├── .jshintrc
│   └── sass-lint.yml
├── .bowerrc
├── .editorconfig
├── .gitignore
├── bower.json
├── gulpfile.js
└── package.json
```

If you want to add a Documentation for your "Module/Plugin/Library"
the following folders / files will be added

```
.
├── doc
├── src
│   └── doc
│       ├── css
│       │   └── main.scss
│       ├── templates
│       │   ├── _includes
│       │   │   └── main-navigation.html
│       │   ├── _layouts
│       │   │   └── default.html
│       │   ├── index.html
│       │   └── subpage.html
│       └── js
│           └── main.js
└── Gemfile
```

and the following gulp task

```
$ gulp doc
```

### If Karma and Jasmine are added:

```
├── tests
│   ├── libs
│   │   └── ...
│   ├── spec
│   │   └── ...
│   └── specs.html
├── karma.config.js
└── webpack-karma.config.js
```

and the following gulp task

```
$ gulp specs
```

will create spec bundle for specs.html:
```
$ gulp specs:debug
```

will start karma in watch mode:

```
$ npm test
```
