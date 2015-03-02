/**
 * Shallow object clone and merge
 *
 * @param a Object A
 * @param b Object B
 * @returns {Object} New object with all of A's properties, and all of B's properties, overwriting A's properties
 */
exports.extend = function(a, b) {
    var c = {};
    for (var x in a) {
        if (a.hasOwnProperty(x)) {
            c[x] = a[x];
        }
    }
    if (b != null) {
        for (var y in b) {
            if (b.hasOwnProperty(y)) {
                c[y] = b[y];
            }
        }
    }
    return c;
};

/**
 * Takes a k/v list of CSS properties and returns a rule
 *
 * @param props CSS properties object
 */
exports.cssProps = function(props) {
    var ret = [];
    for (var p in props) {
        if (props.hasOwnProperty(p)) {
            ret.push(p + ':' + props[p]);
        }
    }
    return ret.join(';');
};

/**
 * Encodes HTML entities in a string
 *
 * @param str Input string
 */
exports.encodeHtmlEntity = function(str) {
    var buf = [];
    var charCode = 0;
    for (var i = str.length - 1; i >= 0; i--) {
        charCode = str.charCodeAt(i);
        if (charCode > 128) {
            buf.unshift(['&#', charCode, ';'].join(''));
        } else {
            buf.unshift(str[i]);
        }
    }
    return buf.join('');
};