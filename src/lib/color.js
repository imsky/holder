var Color = function(color, options) {
    //todo: support rgba, hsla, and rrggbbaa notation
    //todo: use CIELAB internally
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

    if (options && options.alpha) {
        this.alpha = options.alpha;
    }

    this.set(parseInt(color, 16));
};

//todo: jsdocs
Color.rgb2hex = function(r, g, b) {
    return (((r | 0) << 16) + ((g | 0) << 8) + (b | 0)).toString(16);
};

//todo: jsdocs
Color.hsl2rgb = function (h, s, l) {
    var C = (1 - Math.abs(2 * l - 1)) * s;
    var m = l - (C / 2);
    var H = h / 60;
    var X = C * (1 - Math.abs(parseInt(H) % 2 - 1));

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

    return [r, g, b];
};

/**
 * Sets the color from a raw RGB888 integer
 * @param raw RGB888 representation of color
 */
//todo: refactor into a static method
//todo: factor out individual color spaces
//todo: add CIELAB and CIELUV
Color.prototype.set = function (val) {
    this.raw = val;

    var r = (this.raw & 0xFF0000) >> 16;
    var g = (this.raw & 0x00FF00) >> 8;
    var b = (this.raw & 0x0000FF);

    // BT.709
    var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    var u = -0.09991 * r - 0.33609 * g + 0.436 * b;
    var v = 0.615 * r - 0.55861 * g - 0.05639 * b;

    var _r = parseFloat((r / 255).toFixed(4));
    var _g = parseFloat((g / 255).toFixed(4));
    var _b = parseFloat((b / 255).toFixed(4));

    var M = Math.max(_r, _g, _b);
    var m = Math.min(_r, _g, _b);
    var C = M - m;

    var h = 0;
    var s = 0;
    var l = (M + m) / 2;

    if (C !== 0) {
        switch(M) {
            case _r:
                h = parseInt((_g - _b) / C) % 6;
                break;
            case _g:
                h = parseInt((_b - _r) / C) + 2;
                break;
            case _b:
                h = parseInt((_r - _g) / C) + 4;
                break;
        }

        h *= 60;
        s = C / (1 - Math.abs(2 * l - 1));
    }

    this.hsl = {
        h: h,
        s: s,
        l: l
    };

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
    var r = this.rgb.r;
    var g = this.rgb.g;
    var b = this.rgb.b;

    var m = (255 * multiplier) | 0;

    var c = new Color(Color.rgb2hex(r + m, g + m, b + m));
    if (!c.raw) debugger;
    return c;
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
