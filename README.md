generator-gulplate
=========

yeoman generator for the basic structure of a web project with a gulp template

## Install

```
$ npm install -g generator-gulplate
```

## Usage

```
$ mkdir my-project && cd $_
```

then run this yeoman generator

```
$ yo gulplate
```

## What you get

### those gulp tasks

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

```
.
├── dist
│   └── resources
│       ├── css
│       ├── fonts
│       ├── img
│       └── js
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
│   └── templates
│       ├── _includes
│       │   └── main-navigation.html
│       ├── _layouts
│       │   └── default.html
│       ├── index.html
│       └── subpage.html
├── tests
├── .babelrc
├── .editorconfig
├── .eslintrc
├── .gitattributes
├── .gitignore
├── .sass-lint.yml
├── gulpfile.babel.js
├── package.json
└── webpack.config.babel.js
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
│   └── js
│       ├── main.js
│       └── module-a.js
├── tests
├── .babelrc
├── .editorconfig
├── .eslintrc
├── .gitattributes
├── .gitignore
├── .sass-lint.yml
├── gulpfile.babel.js
├── package.json
└── webpack.config.babel.js
```

If you want to add a Documentation for your "Module/Plugin/Library"
the following folders / files will be added

```
.
├── doc
└── src
    └── doc
        ├── css
        │   └── main.scss
        ├── templates
        │   ├── _includes
        │   │   └── main-navigation.html
        │   ├── _layouts
        │   │   └── default.html
        │   ├── index.html
        │   └── subpage.html
        └── js
            └── main.js
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
└── karma.config.js
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
