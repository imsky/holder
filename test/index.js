var runner = require('./runner');
var server = require('node-http-server');

server.deploy({
    'port': 8000,
    'root': __dirname
});

runner({
    'browserName': 'chrome'
}, function (err, retval) {
    console.log('Test result: ', retval);

    if (!retval) {
        process.exitCode = -1;
    }

    process.exit();
});