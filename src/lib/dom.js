/**
 * Generic new DOM element function
 *
 * @private
 * @param tag Tag to create
 * @param namespace Optional namespace value
 */
exports.newEl = function(tag, namespace) {
    if (!global.document) return;

    if (namespace == null) {
        return document.createElement(tag);
    } else {
        return document.createElementNS(namespace, tag);
    }
};

/**
 * Generic setAttribute function
 *
 * @private
 * @param el Reference to DOM element
 * @param attrs Object with attribute keys and values
 */
exports.setAttr = function(el, attrs) {
    for (var a in attrs) {
        el.setAttribute(a, attrs[a]);
    }
};

/**
 * Creates a XML document
 * @private
 */
exports.createXML = function() {
    if (!global.DOMParser) return;
    return new DOMParser().parseFromString('<xml />', 'application/xml');
};
