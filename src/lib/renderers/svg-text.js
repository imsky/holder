var shaven = require('shaven');

var SVG = require('../svg');
var constants = require('../constants');
var utils = require('../utils');

var SVG_NS = constants.svg_ns;

var templates = {
  'element': function (options) {
    var tag = options.tag;
    var content = options.content || '';
    delete options.tag;
    delete options.content;
    return  [tag, content, options];
  }
};

//todo: deprecate tag arg, infer tag from shape object
function convertShape (shape, tag) {
  return templates.element({
    'tag': tag,
    'width': shape.width,
    'height': shape.height,
    'fill': shape.properties.fill
  });
}

module.exports = function (sceneGraph, renderSettings) {
  var holderId = 'holder_' + (Number(new Date()) + 32768 + (0 | Math.random() * 32768)).toString(16);

  var root = sceneGraph.root;
  var textGroup = root.children.holderTextGroup;
  var tgProps = textGroup.properties;

  var css = '#' + holderId + ' text { ' + utils.cssProps({
    'fill': tgProps.fill,
    'font-weight': tgProps.font.weight,
    'font-family': tgProps.font.family + ', monospace',
    'font-size': tgProps.font.size + tgProps.font.units
  }) + ' } ';

  var bg = convertShape(root.children.holderBg, 'rect');

  var scene = templates.element({
    'tag': 'g',
    'id': holderId,
    'content': bg
  });

  var style = templates.element({
    'tag': 'style',
    'content': '<![CDATA[' + css + ']]>',
    'type': 'text/css'
  });

  var defs = templates.element({
    'tag': 'defs',
    'content': style
  });

  var svg = templates.element({
    'tag': 'svg',
    'content': [defs, scene],
    'width': root.properties.width,
    'height': root.properties.height,
    'xmlns': SVG_NS,
    'viewBox': [0, 0, root.properties.width, root.properties.height].join(' '),
    'preserveAspectRatio': 'none'
  });

  var output = shaven(svg);

  var svgString = SVG.svgStringToDataURI(output[0], renderSettings.mode === 'background');
  return svgString;
};