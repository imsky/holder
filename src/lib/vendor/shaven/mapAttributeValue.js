'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _buildTransformString = require('./buildTransformString');

var _buildTransformString2 = _interopRequireDefault(_buildTransformString);

var _stringifyStyleObject = require('./stringifyStyleObject');

var _stringifyStyleObject2 = _interopRequireDefault(_stringifyStyleObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (key, value) {
  if (value === undefined) {
    return '';
  }

  if (key === 'style' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
    return (0, _stringifyStyleObject2.default)(value);
  }

  if (key === 'transform' && Array.isArray(value)) {
    return (0, _buildTransformString2.default)(value);
  }

  return value;
};