var page = require('webpage').create();

page.onConsoleMessage = function (message) {
    console.log('Page: ', message);
};

page.open('index.html', function (status) {
    console.log(status);

    if (status === 'success') {
        page.render('phantom.png');
    }

    phantom.exit();
});
