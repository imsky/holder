var runner = require('./runner');
var server = require('node-http-server');

server.deploy({
    'port': 8000,
    'root': __dirname
});

runner({
    'browserName': 'chrome'
}, function () {
    process.exit();
});