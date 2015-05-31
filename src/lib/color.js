var Color = function(color, options) {
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

    this.alpha = 1;

    if (options) {
        this.alpha = options.alpha || this.alpha;
    }

    colorSet.call(this, parseInt(color, 16));
};

Color.rgbToHex = function(r, g, b) {
    return (((r | 0) << 16) + ((g | 0) << 8) + (b | 0)).toString(16);
};

/**
 * Sets the color from a raw RGB888 integer
 * @param raw RGB888 representation of color
 */
//todo: refactor into a more generic method
function colorSet(raw) {
    this.rgb = {};
    this.yuv = {};
    this.raw = raw;

    this.rgb.r = (raw & 0xFF0000) >> 16;
    this.rgb.g = (raw & 0x00FF00) >> 8;
    this.rgb.b = (raw & 0x0000FF);

    // BT.709
    this.yuv.y = 0.2126 * this.rgb.r + 0.7152 * this.rgb.g + 0.0722 * this.rgb.b;
    this.yuv.u = -0.09991 * this.rgb.r - 0.33609 * this.rgb.g + 0.436 * this.rgb.b;
    this.yuv.v = 0.615 * this.rgb.r - 0.55861 * this.rgb.g - 0.05639 * this.rgb.b;

    return this;
}

/**
 * Lighten or darken a color
 * @param multiplier Amount to lighten or darken (-1 to 1)
 */
Color.prototype.lighten = function(multiplier) {
    var r = this.rgb.r;
    var g = this.rgb.g;
    var b = this.rgb.b;

    var m = (255 * multiplier) | 0;

    return new Color(Color.rgbToHex(r + m, g + m, b + m));
};

/**
 * Output color in hex format
 * @param addHash Add a hash character to the beginning of the output
 */
Color.prototype.toHex = function(addHash) {
    return (addHash ? '#' : '') + this.raw.toString(16);
};

/**
 * Returns whether or not current color is lighter than another color
 * @param color Color to compare against
 */
Color.prototype.lighterThan = function(color) {
    if (!(color instanceof Color)) {
        color = new Color(color);
    }

    return this.yuv.y > color.yuv.y;
};

/**
 * Returns the result of mixing current color with another color
 * @param color Color to mix with
 * @param multiplier How much to mix with the other color
 */
/*
Color.prototype.mix = function (color, multiplier) {
    if (!(color instanceof Color)) {
        color = new Color(color);
    }

    var r = this.rgb.r;
    var g = this.rgb.g;
    var b = this.rgb.b;
    var a = this.alpha;

    var m = typeof multiplier !== 'undefined' ? multiplier : 0.5;

    //todo: write a lerp function
    r = r + m * (color.rgb.r - r);
    g = g + m * (color.rgb.g - g);
    b = b + m * (color.rgb.b - b);
    a = a + m * (color.alpha - a);

    return new Color(Color.rgbToHex(r, g, b), {
        'alpha': a
    });
};
*/

/**
 * Returns the result of blending another color on top of current color with alpha
 * @param color Color to blend on top of current color, i.e. "Ca"
 */
//todo: see if .blendAlpha can be merged into .mix
Color.prototype.blendAlpha = function(color) {
    if (!(color instanceof Color)) {
        color = new Color(color);
    }

    var Ca = color;
    var Cb = this;

    //todo: write alpha blending function
    var r = Ca.alpha * Ca.rgb.r + (1 - Ca.alpha) * Cb.rgb.r;
    var g = Ca.alpha * Ca.rgb.g + (1 - Ca.alpha) * Cb.rgb.g;
    var b = Ca.alpha * Ca.rgb.b + (1 - Ca.alpha) * Cb.rgb.b;

    return new Color(Color.rgbToHex(r, g, b));
};

module.exports = Color;
