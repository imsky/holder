var path = require('path');

var playwright = require('playwright');

var chromium = playwright.chromium;

var browser;
var ctx;
var page;

chromium.launch()
  .then(function (_browser) {
    browser = _browser;
    return browser.newContext();
  })
  .then(function (context) {
    ctx = context;
    return ctx.newPage();
  })
  .then(function (_page) {
    page = _page;
    return page.goto('file:' + path.join(__dirname, 'index.html'), { waitUntil: 'domcontentloaded' });
  })
  .then(function () {
    return page.screenshot({ path: 'screenshot.png' });
  })
  .finally(function () {
    return browser.close();
  });
