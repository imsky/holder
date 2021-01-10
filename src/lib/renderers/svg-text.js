var shaven = require('../vendor/shaven').default;

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

function textCss (properties) {
  return utils.cssProps({
    'fill': properties.fill,
    'font-weight': properties.font.weight,
    'font-family': properties.font.family + ', monospace',
    'font-size': properties.font.size + properties.font.units
  });
}

function outlinePath (bgWidth, bgHeight, outlineWidth) {
  var outlineOffsetWidth = outlineWidth / 2;

  return [
    'M', outlineOffsetWidth, outlineOffsetWidth,
    'H', bgWidth - outlineOffsetWidth,
    'V', bgHeight - outlineOffsetWidth,
    'H', outlineOffsetWidth,
    'V', 0,
    'M', 0, outlineOffsetWidth,
    'L', bgWidth, bgHeight - outlineOffsetWidth,
    'M', 0, bgHeight - outlineOffsetWidth,
    'L', bgWidth, outlineOffsetWidth
  ].join(' ');
}

module.exports = function (sceneGraph, renderSettings) {
  var engineSettings = renderSettings.engineSettings;
  var stylesheets = engineSettings.stylesheets;
  var stylesheetXml = stylesheets.map(function (stylesheet) {
    return '<?xml-stylesheet rel="stylesheet" href="' + stylesheet + '"?>';
  }).join('\n');

  var holderId = 'holder_' + Number(new Date()).toString(16);

  var root = sceneGraph.root;
  var textGroup = root.children.holderTextGroup;

  var css = '#' + holderId + ' text { ' + textCss(textGroup.properties) + ' } ';

  // push text down to be equally vertically aligned with canvas renderer
  textGroup.y += textGroup.textPositionData.boundingBox.height * 0.8;

  var wordTags = [];

  Object.keys(textGroup.children).forEach(function (lineKey) {
    var line = textGroup.children[lineKey];

    Object.keys(line.children).forEach(function (wordKey) {
      var word = line.children[wordKey];
      var x = textGroup.x + line.x + word.x;
      var y = textGroup.y + line.y + word.y;
      var wordTag = templates.element({
        'tag': 'text',
        'content': word.properties.text,
        'x': x,
        'y': y
      });

      wordTags.push(wordTag);
    });
  });

  var text = templates.element({
    'tag': 'g',
    'content': wordTags
  });

  var outline = null;

  if (root.children.holderBg.properties.outline) {
    var outlineProperties = root.children.holderBg.properties.outline;
    outline = templates.element({
      'tag': 'path',
      'd': outlinePath(root.children.holderBg.width, root.children.holderBg.height, outlineProperties.width),
      'stroke-width': outlineProperties.width,
      'stroke': outlineProperties.fill,
      'fill': 'none'
    });
  }

  var bg = convertShape(root.children.holderBg, 'rect');

  var sceneContent = [];

  sceneContent.push(bg);
  if (outlineProperties) {
    sceneContent.push(outline);
  }
  sceneContent.push(text);

  var scene = templates.element({
    'tag': 'g',
    'id': holderId,
    'content': sceneContent
  });

  var style = templates.element({
    'tag': 'style',
    //todo: figure out how to add CDATA directive
    'content': css,
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

  var output = String(shaven(svg));

  if (/&amp;(x)?#[0-9A-Fa-f]/.test(output[0])) {
    output = output.replace(/&amp;#/gm, '&#');
  }

  output = stylesheetXml + output;

  var svgString = SVG.svgStringToDataURI(output, renderSettings.mode === 'background');

  return svgString;
};
