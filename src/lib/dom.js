/**
 * Generic new DOM element function
 *
 * @param tag Tag to create
 * @param namespace Optional namespace value
 */
exports.newEl = function(tag, namespace) {
    if (!global.document) return;

    if (namespace == null) {
        return global.document.createElement(tag);
    } else {
        return global.document.createElementNS(namespace, tag);
    }
};

/**
 * Generic setAttribute function
 *
 * @param el Reference to DOM element
 * @param attrs Object with attribute keys and values
 */
exports.setAttr = function (el, attrs) {
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

/**
 * Converts a value into an array of DOM nodes
 *
 * @param val A string, a NodeList, a Node, or an HTMLCollection
 */
exports.getNodeArray = function(val) {
    var retval = null;
    if (typeof(val) == 'string') {
        retval = document.querySelectorAll(val);
    } else if (global.NodeList && val instanceof global.NodeList) {
        retval = val;
    } else if (global.Node && val instanceof global.Node) {
        retval = [val];
    } else if (global.HTMLCollection && val instanceof global.HTMLCollection) {
        retval = val;
    } else if (val instanceof Array) {
        retval = val;
    } else if (val === null) {
        retval = [];
    }

    retval = Array.prototype.slice.call(retval);

    return retval;
};
