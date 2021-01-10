'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = shaven;

var _parseSugarString = require('./parseSugarString');

var _parseSugarString2 = _interopRequireDefault(_parseSugarString);

var _escape = require('./escape');

var escape = _interopRequireWildcard(_escape);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _mapAttributeValue = require('./mapAttributeValue');

var _mapAttributeValue2 = _interopRequireDefault(_mapAttributeValue);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function shaven(arrayOrObject) {
  var isArray = Array.isArray(arrayOrObject);
  var objType = typeof arrayOrObject === 'undefined' ? 'undefined' : _typeof(arrayOrObject);

  if (!isArray && objType !== 'object') {
    throw new Error('Argument must be either an array or an object ' + 'and not ' + JSON.stringify(arrayOrObject));
  }

  if (isArray && arrayOrObject.length === 0) {
    // Ignore empty arrays
    return {};
  }

  var config = {};
  var elementArray = [];

  if (Array.isArray(arrayOrObject)) {
    elementArray = arrayOrObject.slice(0);
  } else {
    elementArray = arrayOrObject.elementArray.slice(0);
    config = Object.assign(config, arrayOrObject);
    delete config.elementArray;
  }

  config = Object.assign({}, _defaults2.default, config, {
    returnObject: { // Shaven object to return at last
      ids: {},
      references: {}
    }
  });

  function createElement(sugarString) {
    var properties = (0, _parseSugarString2.default)(sugarString);
    var element = {
      tag: properties.tag,
      attr: {},
      children: []
    };

    if (properties.id) {
      element.attr.id = properties.id;
      (0, _assert2.default)(!config.returnObject.ids.hasOwnProperty(properties.id), 'Ids must be unique and "' + properties.id + '" is already assigned');
      config.returnObject.ids[properties.id] = element;
    }
    if (properties.class) {
      element.attr.class = properties.class;
    }
    if (properties.reference) {
      (0, _assert2.default)(!config.returnObject.ids.hasOwnProperty(properties.reference), 'References must be unique and "' + properties.id + '" is already assigned');
      config.returnObject.references[properties.reference] = element;
    }

    config.escapeHTML = properties.escapeHTML != null ? properties.escapeHTML : config.escapeHTML;

    return element;
  }

  function buildDom(elemArray) {
    if (Array.isArray(elemArray) && elemArray.length === 0) {
      // Ignore empty arrays
      return {};
    }

    var index = 1;
    var createdCallback = void 0;
    var selfClosingHTMLTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
    // Clone to avoid mutation problems
    var array = elemArray.slice(0);

    if (typeof array[0] === 'string') {
      array[0] = createElement(array[0]);
    } else if (Array.isArray(array[0])) {
      index = 0;
    } else {
      throw new Error('First element of array must be a string, ' + 'or an array and not ' + JSON.stringify(array[0]));
    }

    for (; index < array.length; index++) {

      // Don't render element if value is false or null
      if (array[index] === false || array[index] === null) {
        array[0] = false;
        break;
      }

      // Continue with next array value if current value is undefined or true
      else if (array[index] === undefined || array[index] === true) {
          continue;
        } else if (typeof array[index] === 'string') {
          if (config.escapeHTML) {
            // eslint-disable-next-line new-cap
            array[index] = escape.HTML(array[index]);
          }

          array[0].children.push(array[index]);
        } else if (typeof array[index] === 'number') {

          array[0].children.push(array[index]);
        } else if (Array.isArray(array[index])) {

          if (Array.isArray(array[index][0])) {
            array[index].reverse().forEach(function (subArray) {
              // eslint-disable-line no-loop-func
              array.splice(index + 1, 0, subArray);
            });

            if (index !== 0) continue;
            index++;
          }

          array[index] = buildDom(array[index]);

          if (array[index][0]) {
            array[0].children.push(array[index][0]);
          }
        } else if (typeof array[index] === 'function') {
          createdCallback = array[index];
        } else if (_typeof(array[index]) === 'object') {
          for (var attributeKey in array[index]) {
            if (!array[index].hasOwnProperty(attributeKey)) continue;

            var attributeValue = array[index][attributeKey];

            if (array[index].hasOwnProperty(attributeKey) && attributeValue !== null && attributeValue !== false) {
              array[0].attr[attributeKey] = (0, _mapAttributeValue2.default)(attributeKey, attributeValue);
            }
          }
        } else {
          throw new TypeError('"' + array[index] + '" is not allowed as a value');
        }
    }

    if (array[0] !== false) {
      var HTMLString = '<' + array[0].tag;

      for (var key in array[0].attr) {
        if (array[0].attr.hasOwnProperty(key)) {
          var _attributeValue = escape.attribute(array[0].attr[key]);
          var value = _attributeValue;

          if (config.quoteAttributes || /[ "'=<>]/.test(_attributeValue)) {
            value = config.quotationMark + _attributeValue + config.quotationMark;
          }

          HTMLString += ' ' + key + '=' + value;
        }
      }

      HTMLString += '>';

      if (!(selfClosingHTMLTags.indexOf(array[0].tag) !== -1)) {
        array[0].children.forEach(function (child) {
          return HTMLString += child;
        });

        HTMLString += '</' + array[0].tag + '>';
      }

      array[0] = HTMLString;
    }

    // Return root element on index 0
    config.returnObject[0] = array[0];
    config.returnObject.rootElement = array[0];

    config.returnObject.toString = function () {
      return array[0];
    };

    if (createdCallback) createdCallback(array[0]);

    return config.returnObject;
  }

  return buildDom(elementArray);
}

shaven.setDefaults = function (object) {
  Object.assign(_defaults2.default, object);
  return shaven;
};
