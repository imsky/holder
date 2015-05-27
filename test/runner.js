var client = require('webdriverio');

module.exports = function (options, cb) {
    var retval = true;

    client.remote({
        'user': process.env.SAUCE_USERNAME,
        'key': process.env.SAUCE_ACCESS_KEY,
        'host': 'localhost',
        'port': 4445,
        'desiredCapabilities': {
            'browserName': options.browserName,
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            'name': 'Holder.js Test',
            'tags': [options.browserName]
        }
    })
    .init()
    .url('http://localhost:8000')
    .execute(function () {
        var expectImages = document.querySelectorAll('img').length - document.querySelectorAll('img[data-exclude]').length;
        var renderedImages = document.querySelectorAll('img[data-holder-rendered]').length;
        return {'expected': expectImages, 'rendered': renderedImages};
    }, function (err, ret) {
        var expected = ret.value.expected;
        var rendered = ret.value.rendered;
        console.log('Expected', expected);
        console.log('Rendered', rendered);
        if (expected !== rendered) {
            retval = false;
        }
    })
    .pause(15 * 1000)
    .end(function () {
        cb(null, retval);
    });
};
