
import moduleA from '../../src/js/module-a';

describe('zap', function() {
    beforeEach(function () {
    });

    afterEach(function () {
    });

    it('dummy entry', function() {
        expect(true).toEqual(true);
    });

    it('moduleA.hello', function() {
        expect(moduleA.hello()).toEqual('whazap?');
    });
});
