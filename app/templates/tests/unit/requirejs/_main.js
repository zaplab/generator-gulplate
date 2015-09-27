
require.config({
    paths: {
        chai: '../../libs/chai',
        moduleA: ''
    }
});

require([], function () {
    // unit tests
    require([
        'unit/requirejs/basic.js'
    ], function () {
        // tell mocha we are done setting everything up
        mocha.run();
    });
});
