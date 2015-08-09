var SVG = require('../svg');
var DOM = require('../dom');
var utils = require('../utils');
var constants = require('../constants');

var SVG_NS = constants.svg_ns;

var generatorComment = '\n' +
    'Created with Holder.js ' + constants.version + '.\n' +
    'Learn more at http://holderjs.com\n' +
    '(c) 2012-2015 Ivan Malopinsky - http://imsky.co\n';

module.exports = (function() {
    //Prevent IE <9 from initializing SVG renderer
    if (!global.XMLSerializer) return;
    var xml = DOM.createXML();
    var svg = SVG.initSVG(null, 0, 0);
    var bgEl = DOM.newEl('rect', SVG_NS);
    svg.appendChild(bgEl);

    //todo: create a reusable pool for textNodes, resize if more words present

    return function(sceneGraph, renderSettings) {
        var root = sceneGraph.root;

        SVG.initSVG(svg, root.properties.width, root.properties.height);

        var groups = svg.querySelectorAll('g');

        for (var i = 0; i < groups.length; i++) {
            groups[i].parentNode.removeChild(groups[i]);
        }

        var holderURL = renderSettings.holderSettings.flags.holderURL;
        var holderId = 'holder_' + (Number(new Date()) + 32768 + (0 | Math.random() * 32768)).toString(16);
        var sceneGroupEl = DOM.newEl('g', SVG_NS);
        var textGroup = root.children.holderTextGroup;
        var tgProps = textGroup.properties;
        var textGroupEl = DOM.newEl('g', SVG_NS);
        var tpdata = textGroup.textPositionData;
        var textCSSRule = '#' + holderId + ' text { ' +
            utils.cssProps({
                'fill': tgProps.fill,
                'font-weight': tgProps.font.weight,
                'font-family': tgProps.font.family + ', monospace',
                'font-size': tgProps.font.size + tgProps.font.units
            }) + ' } ';
        var commentNode = xml.createComment('\n' + 'Source URL: ' + holderURL + generatorComment);
        var holderCSS = xml.createCDATASection(textCSSRule);
        var styleEl = svg.querySelector('style');
        var bg = root.children.holderBg;

        DOM.setAttr(sceneGroupEl, {
            id: holderId
        });

        svg.insertBefore(commentNode, svg.firstChild);
        styleEl.appendChild(holderCSS);

        sceneGroupEl.appendChild(bgEl);

        //todo: abstract this into a cross-browser SVG outline method
        if (bg.properties.outline) {
            var outlineEl = DOM.newEl('path', SVG_NS);
            var outlineWidth = bg.properties.outline.width;
            var outlineOffsetWidth = outlineWidth / 2;
            DOM.setAttr(outlineEl, {
                'd': [
                    'M', outlineOffsetWidth, outlineOffsetWidth,
                    'H', bg.width - outlineOffsetWidth,
                    'V', bg.height - outlineOffsetWidth,
                    'H', outlineOffsetWidth,
                    'V', 0,
                    'M', 0, outlineOffsetWidth,
                    'L', bg.width, bg.height - outlineOffsetWidth,
                    'M', 0, bg.height - outlineOffsetWidth,
                    'L', bg.width, outlineOffsetWidth
                ].join(' '),
                'stroke-width': bg.properties.outline.width,
                'stroke': bg.properties.outline.fill,
                'fill': 'none'
            });
            sceneGroupEl.appendChild(outlineEl);
        }

        sceneGroupEl.appendChild(textGroupEl);
        svg.appendChild(sceneGroupEl);

        DOM.setAttr(bgEl, {
            'width': bg.width,
            'height': bg.height,
            'fill': bg.properties.fill
        });

        textGroup.y += tpdata.boundingBox.height * 0.8;

        for (var lineKey in textGroup.children) {
            var line = textGroup.children[lineKey];
            for (var wordKey in line.children) {
                var word = line.children[wordKey];
                var x = textGroup.x + line.x + word.x;
                var y = textGroup.y + line.y + word.y;

                var textEl = DOM.newEl('text', SVG_NS);
                var textNode = document.createTextNode(null);

                DOM.setAttr(textEl, {
                    'x': x,
                    'y': y
                });

                textNode.nodeValue = word.properties.text;
                textEl.appendChild(textNode);
                textGroupEl.appendChild(textEl);
            }
        }

        //todo: factor the background check up the chain, perhaps only return reference
        var svgString = SVG.svgStringToDataURI(SVG.serializeSVG(svg, renderSettings.engineSettings), renderSettings.mode === 'background');
        return svgString;
    };
})();