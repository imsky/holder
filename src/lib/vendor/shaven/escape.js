'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attribute = attribute;
exports.HTML = HTML;
function attribute(string) {
  return string || string === 0 ? String(string).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : '';
}

function HTML(string) {
  return String(string).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}