
// Immediately-Invoked Function Expression
(function iife(global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], function amd() {
            return factory();
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        // commonjs
        module.exports = factory();
    } else {
        global.moduleA = factory();
    }
}(typeof window !== 'undefined' ? window : this, function factory() {
    return {
        log: function log() {
            console.log('module-a');
        },
    };
}));
