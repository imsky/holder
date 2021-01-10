'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// Create transform string from list transform objects

exports.default = function (transformObjects) {

  return transformObjects.map(function (transformation) {
    var values = [];

    if (transformation.type === 'rotate' && transformation.degrees) {
      values.push(transformation.degrees);
    }
    if (transformation.x) values.push(transformation.x);
    if (transformation.y) values.push(transformation.y);

    return transformation.type + '(' + values + ')';
  }).join(' ');
};