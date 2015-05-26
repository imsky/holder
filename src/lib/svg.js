var DOM = require('./dom');

var SVG_NS = 'http://www.w3.org/2000/svg';
var NODE_TYPE_COMMENT = 8;

/**
 * Generic SVG element creation function
 *
 * @private
 * @param svg SVG context, set to null if new
 * @param width Document width
 * @param height Document height
 */
exports.initSVG = function(svg, width, height) {
    var defs, style, initialize = false;

    if (svg && svg.querySelector) {
        style = svg.querySelector('style');
        if (style === null) {
            initialize = true;
        }
    } else {
        svg = DOM.newEl('svg', SVG_NS);
        initialize = true;
    }

    if (initialize) {
        defs = DOM.newEl('defs', SVG_NS);
        style = DOM.newEl('style', SVG_NS);
        DOM.setAttr(style, {
            'type': 'text/css'
        });
        defs.appendChild(style);
        svg.appendChild(defs);
    }

    //IE throws an exception if this is set and Chrome requires it to be set
    if (svg.webkitMatchesSelector) {
        svg.setAttribute('xmlns', SVG_NS);
    }

    //Remove comment nodes
    for (var i = 0; i < svg.childNodes.length; i++) {
        if (svg.childNodes[i].nodeType === NODE_TYPE_COMMENT) {
            svg.removeChild(svg.childNodes[i]);
        }
    }

    //Remove CSS
    while (style.childNodes.length) {
        style.removeChild(style.childNodes[0]);
    }

    DOM.setAttr(svg, {
        'width': width,
        'height': height,
        'viewBox': '0 0 ' + width + ' ' + height,
        'preserveAspectRatio': 'none'
    });

    return svg;
};

/**
 * Converts serialized SVG to a string suitable for data URI use
 * @param svgString Serialized SVG string
 * @param [base64] Use base64 encoding for data URI
 */
exports.svgStringToDataURI = function() {
    var rawPrefix = 'data:image/svg+xml;charset=UTF-8,';
    var base64Prefix = 'data:image/svg+xml;charset=UTF-8;base64,';

    return function(svgString, base64) {
        if (base64) {
            return base64Prefix + btoa(unescape(encodeURIComponent(svgString)));
        } else {
            return rawPrefix + encodeURIComponent(svgString);
        }
    };
}();

/**
 * Returns serialized SVG with XML processing instructions
 *
 * @private
 * @param svg SVG context
 * @param stylesheets CSS stylesheets to include
 */
exports.serializeSVG = function(svg, engineSettings) {
    if (!global.XMLSerializer) return;
    var serializer = new XMLSerializer();
    var svgCSS = '';
    var stylesheets = engineSettings.stylesheets;

    //External stylesheets: Processing Instruction method
    if (engineSettings.svgXMLStylesheet) {
        var xml = DOM.createXML();
        //Add <?xml-stylesheet ?> directives
        for (var i = stylesheets.length - 1; i >= 0; i--) {
            var csspi = xml.createProcessingInstruction('xml-stylesheet', 'href="' + stylesheets[i] + '" rel="stylesheet"');
            xml.insertBefore(csspi, xml.firstChild);
        }

        xml.removeChild(xml.documentElement);
        svgCSS = serializer.serializeToString(xml);
    }

    var svgText = serializer.serializeToString(svg);
    svgText = svgText.replace(/\&amp;(\#[0-9]{2,}\;)/g, '&$1');
    return svgCSS + svgText;
};
