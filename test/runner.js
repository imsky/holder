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
        var renderedImages = document.querySelectorAll('img[data-holder-rendered]');
        return expectImages === renderedImages;
    }, function (err, ret) {
        if (!ret.value) {
            retval = false;
        }
    })
    .pause(15 * 1000)
    .end(function () {
        cb(null, retval)
    });
};
