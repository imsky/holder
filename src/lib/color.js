var Color = function(color, options) {
    //todo: support rgba, hsla, and rrggbbaa notation
    //todo: use CIELAB internally
    //todo: add clamp function (with sign)
    if (typeof color !== 'string') return;

    this.original = color;

    if (color.charAt(0) === '#') {
        color = color.slice(1);
    }

    if (/[^a-f0-9]+/i.test(color)) return;

    if (color.length === 3) {
        color = color.replace(/./g, '$&$&');
    }

    if (color.length !== 6) return;

    this.alpha = 1;

    if (options && options.alpha) {
        this.alpha = options.alpha;
    }

    this.set(parseInt(color, 16));
};

//todo: jsdocs
Color.rgb2hex = function(r, g, b) {
    function format (decimal) {
        var hex = (decimal | 0).toString(16);
        if (decimal < 16) {
            hex = '0' + hex;
        }
        return hex;
    }

    return [r, g, b].map(format).join('');
};

//todo: jsdocs
Color.hsl2rgb = function (h, s, l) {
    var H = h / 60;
    var C = (1 - Math.abs(2 * l - 1)) * s;
    var X = C * (1 - Math.abs(parseInt(H) % 2 - 1));
    var m = l - (C / 2);

    var r = 0, g = 0, b = 0;

    if (H >= 0 && H < 1) {
        r = C;
        g = X;
    } else if (H >= 1 && H < 2) {
        r = X;
        g = C;
    } else if (H >= 2 && H < 3) {
        g = C;
        b = X;
    } else if (H >= 3 && H < 4) {
        g = X;
        b = C;
    } else if (H >= 4 && H < 5) {
        r = X;
        b = C;
    } else if (H >= 5 && H < 6) {
        r = C;
        b = X;
    }

    r += m;
    g += m;
    b += m;

    r = parseInt(r * 255);
    g = parseInt(g * 255);
    b = parseInt(b * 255);

    return [r, g, b];
};

/**
 * Sets the color from a raw RGB888 integer
 * @param raw RGB888 representation of color
 */
//todo: refactor into a static method
//todo: factor out individual color spaces
//todo: add HSL, CIELAB, and CIELUV
Color.prototype.set = function (val) {
    this.raw = val;

    var r = (this.raw & 0xFF0000) >> 16;
    var g = (this.raw & 0x00FF00) >> 8;
    var b = (this.raw & 0x0000FF);

    // BT.709
    var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    var u = -0.09991 * r - 0.33609 * g + 0.436 * b;
    var v = 0.615 * r - 0.55861 * g - 0.05639 * b;

    this.rgb = {
        r: r,
        g: g,
        b: b
    };

    this.yuv = {
        y: y,
        u: u,
        v: v
    };

    return this;
};

/**
 * Lighten or darken a color
 * @param multiplier Amount to lighten or darken (-1 to 1)
 */
Color.prototype.lighten = function(multiplier) {
    var cm = Math.min(1, Math.max(0, Math.abs(multiplier))) * (multiplier < 0 ? -1 : 1);
    var bm = (255 * cm) | 0;
    var cr = Math.min(255, Math.max(0, this.rgb.r + bm));
    var cg = Math.min(255, Math.max(0, this.rgb.g + bm));
    var cb = Math.min(255, Math.max(0, this.rgb.b + bm));
    var hex = Color.rgb2hex(cr, cg, cb);
    return new Color(hex);
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

    return new Color(Color.rgb2hex(r, g, b));
};

module.exports = Color;
