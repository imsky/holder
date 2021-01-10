'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function sanitizeProperties(key, value) {
  if (value === null || value === false || value === undefined) return;
  if (typeof value === 'string' || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') return value;

  return String(value);
}

exports.default = function (styleObject) {
  return JSON.stringify(styleObject, sanitizeProperties).slice(2, -2).replace(/","/g, ';').replace(/":"/g, ':').replace(/\\"/g, '\'');
};