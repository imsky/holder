'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sugarString) {
  var tags = sugarString.match(/^[\w-]+/);
  var properties = {
    tag: tags ? tags[0] : 'div'
  };
  var ids = sugarString.match(/#([\w-]+)/);
  var classes = sugarString.match(/\.[\w-]+/g);
  var references = sugarString.match(/\$([\w-]+)/);

  if (ids) properties.id = ids[1];

  if (classes) {
    properties.class = classes.join(' ').replace(/\./g, '');
  }

  if (references) properties.reference = references[1];

  if (sugarString.endsWith('&') || sugarString.endsWith('!')) {
    properties.escapeHTML = false;
  }

  return properties;
};