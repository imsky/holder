var Color = function (color) {
    //todo: support array->color conversion
    //todo: support rgba, hsla, and rrggbbaa notation
    if (typeof color !== 'string') return;

    if (color.charAt(0) === '#') {
        color = color.slice(1);
    }

    if (/[^a-f0-9]+/i.test(color)) return;

    if (color.length === 3) {
        color = color.replace(/./g, '$&$&');
    }

    if (color.length !== 6) return;

    this.set(parseInt(color, 16));
};


/**
 * Sets the color from a raw RGB888 integer
 * @param raw RGB888 representation of color
 */
Color.prototype.set = function (raw) {
    var triple = raw;

    this.rgb = {};
    this.yuv = {};
    this.raw = triple;

    this.rgb.r = (triple & 0xFF0000) >> 16;
    this.rgb.g = (triple & 0x00FF00) >> 8;
    this.rgb.b = (triple & 0x0000FF);

    // BT.709
    this.yuv.y = 0.2126 * this.rgb.r + 0.7152 * this.rgb.g + 0.0722 * this.rgb.b;
    this.yuv.u = -0.09991 * this.rgb.r - 0.33609 * this.rgb.g + 0.436 * this.rgb.b;
    this.yuv.v = 0.615 * this.rgb.r - 0.55861 * this.rgb.g - 0.05639 * this.rgb.b;

    return this;
};

/**
 * Lighten or darken a color
 * @param multiplier Amount to lighten or darken (-1 to 1)
 */
Color.prototype.lighten = function (multiplier) {
    var r = this.rgb.r;
    var g = this.rgb.g;
    var b = this.rgb.b;

    var m = (255 * multiplier) | 0;

    this.set(((r + m) << 16) + ((g + m) << 8) + (b + m));
    return this;
};

/**
 * Output color in hex format
 * @param addHash Add a hash character to the beginning of the output
 */ 
Color.prototype.toHex = function (addHash) {
    return (addHash ? '#' : '') + this.raw.toString(16);
};

/**
 * Returns whether or not current color is lighter than another color
 * @param color Color to compare against
 */
Color.prototype.lighterThan = function (color) {
    if (!(color instanceof Color)) {
        color = new Color(color);
    }

    return this.yuv.y > color.yuv.y;
};

module.exports = Color;