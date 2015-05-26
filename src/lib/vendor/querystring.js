//Modified version of component/querystring
//Changes: updated dependencies, dot notation parsing, JSHint fixes
//Fork at https://github.com/imsky/querystring

/**
 * Module dependencies.
 */

var encode = encodeURIComponent;
var decode = decodeURIComponent;
var trim = require('trim');
var type = require('component-type');

var arrayRegex = /(\w+)\[(\d+)\]/;
var objectRegex = /\w+\.\w+/;

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' !== typeof str) return {};

  str = trim(str);
  if ('' === str) return {};
  if ('?' === str.charAt(0)) str = str.slice(1);

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    var key = decode(parts[0]);
    var m, ctx, prop;

    if (m = arrayRegex.exec(key)) {
      obj[m[1]] = obj[m[1]] || [];
      obj[m[1]][m[2]] = decode(parts[1]);
      continue;
    }

    if (m = objectRegex.test(key)) {
      m = key.split('.');
      ctx = obj;
      
      while (m.length) {
        prop = m.shift();

        if (!prop.length) continue;

        if (!ctx[prop]) {
          ctx[prop] = {};
        } else if (ctx[prop] && typeof ctx[prop] !== 'object') {
          break;
        }

        if (!m.length) {
          ctx[prop] = decode(parts[1]);
        }

        ctx = ctx[prop];
      }

      continue;
    }

    obj[parts[0]] = null == parts[1] ? '' : decode(parts[1]);
  }

  return obj;
};

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];

  for (var key in obj) {
    var value = obj[key];

    if ('array' == type(value)) {
      for (var i = 0; i < value.length; ++i) {
        pairs.push(encode(key + '[' + i + ']') + '=' + encode(value[i]));
      }
      continue;
    }

    pairs.push(encode(key) + '=' + encode(obj[key]));
  }

  return pairs.join('&');
};
