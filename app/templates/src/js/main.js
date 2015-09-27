
// Immediately-Invoked Function Expression
(function iife(global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([
            'module-a',
        ], function amd(
            moduleA
        ) {
            return factory(
                moduleA
            );
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // commonjs
        module.exports = factory(
            require('./module-a')
        );
    } else {
        factory(
            moduleA
        );
    }
}(typeof window !== 'undefined' ? window : this, function factory(
    moduleA
) {
    console.log('gulplate');
    moduleA.log();
}));
