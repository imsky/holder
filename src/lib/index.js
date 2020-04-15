/*
Holder.js - client side image placeholders
(c) 2012-2020 Ivan Malopinsky - http://imsky.co
*/

//Libraries and functions
var onDomReady = require('./vendor/ondomready');
var querystring = require('./vendor/querystring');

var SceneGraph = require('./scenegraph');
var utils = require('./utils');
var SVG = require('./svg');
var DOM = require('./dom');
var Color = require('./color');
var constants = require('./constants');

var svgRenderer = require('./renderers/svg-text');
var sgCanvasRenderer = require('./renderers/canvas');

var extend = utils.extend;
var dimensionCheck = utils.dimensionCheck;

//Constants and definitions
var SVG_NS = constants.svg_ns;

var Holder = {
    version: constants.version,

    /**
     * Adds a theme to default settings
     *
     * @param {string} name Theme name
     * @param {Object} theme Theme object, with foreground, background, size, font, and fontweight properties.
     */
    addTheme: function(name, theme) {
        name != null && theme != null && (App.settings.themes[name] = theme);
        delete App.vars.cache.themeKeys;
        return this;
    },

    /**
     * Appends a placeholder to an element
     *
     * @param {string} src Placeholder URL string
     * @param el A selector or a reference to a DOM node
     */
    addImage: function(src, el) {
        //todo: use jquery fallback if available for all QSA references
        var nodes = DOM.getNodeArray(el);
        nodes.forEach(function (node) {
            var img = DOM.newEl('img');
            var domProps = {};
            domProps[App.setup.dataAttr] = src;
            DOM.setAttr(img, domProps);
            node.appendChild(img);
        });
        return this;
    },

    /**
     * Sets whether or not an image is updated on resize.
     * If an image is set to be updated, it is immediately rendered.
     *
     * @param {Object} el Image DOM element
     * @param {Boolean} value Resizable update flag value
     */
    setResizeUpdate: function(el, value) {
        if (el.holderData) {
            el.holderData.resizeUpdate = !!value;
            if (el.holderData.resizeUpdate) {
                updateResizableElements(el);
            }
        }
    },

    /**
     * Runs Holder with options. By default runs Holder on all images with "holder.js" in their source attributes.
     *
     * @param {Object} userOptions Options object, can contain domain, themes, images, and bgnodes properties
     */
    run: function(userOptions) {
        //todo: split processing into separate queues
        userOptions = userOptions || {};
        var engineSettings = {};
        var options = extend(App.settings, userOptions);

        App.vars.preempted = true;
        App.vars.dataAttr = options.dataAttr || App.setup.dataAttr;

        engineSettings.renderer = options.renderer ? options.renderer : App.setup.renderer;
        if (App.setup.renderers.join(',').indexOf(engineSettings.renderer) === -1) {
            engineSettings.renderer = App.setup.supportsSVG ? 'svg' : (App.setup.supportsCanvas ? 'canvas' : 'html');
        }

        var images = DOM.getNodeArray(options.images);
        var bgnodes = DOM.getNodeArray(options.bgnodes);
        var stylenodes = DOM.getNodeArray(options.stylenodes);
        var objects = DOM.getNodeArray(options.objects);

        engineSettings.stylesheets = [];
        engineSettings.svgXMLStylesheet = true;
        engineSettings.noFontFallback = !!options.noFontFallback;
        engineSettings.noBackgroundSize = !!options.noBackgroundSize;

        stylenodes.forEach(function (styleNode) {
            if (styleNode.attributes.rel && styleNode.attributes.href && styleNode.attributes.rel.value == 'stylesheet') {
                var href = styleNode.attributes.href.value;
                //todo: write isomorphic relative-to-absolute URL function
                var proxyLink = DOM.newEl('a');
                proxyLink.href = href;
                var stylesheetURL = proxyLink.protocol + '//' + proxyLink.host + proxyLink.pathname + proxyLink.search;
                engineSettings.stylesheets.push(stylesheetURL);
            }
        });

        bgnodes.forEach(function (bgNode) {
            //Skip processing background nodes if getComputedStyle is unavailable, since only modern browsers would be able to use canvas or SVG to render to background
            if (!global.getComputedStyle) return;
            var backgroundImage = global.getComputedStyle(bgNode, null).getPropertyValue('background-image');
            var dataBackgroundImage = bgNode.getAttribute('data-background-src');
            var rawURL = dataBackgroundImage || backgroundImage;

            var holderURL = null;
            var holderString = options.domain + '/';
            var holderStringIndex = rawURL.indexOf(holderString);

            if (holderStringIndex === 0) {
                holderURL = rawURL;
            } else if (holderStringIndex === 1 && rawURL[0] === '?') {
                holderURL = rawURL.slice(1);
            } else {
                var fragment = rawURL.substr(holderStringIndex).match(/([^\"]*)"?\)/);
                if (fragment !== null) {
                    holderURL = fragment[1];
                } else if (rawURL.indexOf('url(') === 0) {
                    throw 'Holder: unable to parse background URL: ' + rawURL;
                }
            }

            if (holderURL) {
                var holderFlags = parseURL(holderURL, options);
                if (holderFlags) {
                    prepareDOMElement({
                        mode: 'background',
                        el: bgNode,
                        flags: holderFlags,
                        engineSettings: engineSettings
                    });
                }
            }
        });

        objects.forEach(function (object) {
            var objectAttr = {};

            try {
                objectAttr.data = object.getAttribute('data');
                objectAttr.dataSrc = object.getAttribute(App.vars.dataAttr);
            } catch (e) {}

            var objectHasSrcURL = objectAttr.data != null && objectAttr.data.indexOf(options.domain) === 0;
            var objectHasDataSrcURL = objectAttr.dataSrc != null && objectAttr.dataSrc.indexOf(options.domain) === 0;

            if (objectHasSrcURL) {
                prepareImageElement(options, engineSettings, objectAttr.data, object);
            } else if (objectHasDataSrcURL) {
                prepareImageElement(options, engineSettings, objectAttr.dataSrc, object);
            }
        });

        images.forEach(function (image) {
            var imageAttr = {};

            try {
                imageAttr.src = image.getAttribute('src');
                imageAttr.dataSrc = image.getAttribute(App.vars.dataAttr);
                imageAttr.rendered = image.getAttribute('data-holder-rendered');
            } catch (e) {}

            var imageHasSrc = imageAttr.src != null;
            var imageHasDataSrcURL = imageAttr.dataSrc != null && imageAttr.dataSrc.indexOf(options.domain) === 0;
            var imageRendered = imageAttr.rendered != null && imageAttr.rendered == 'true';

            if (imageHasSrc) {
                if (imageAttr.src.indexOf(options.domain) === 0) {
                    prepareImageElement(options, engineSettings, imageAttr.src, image);
                } else if (imageHasDataSrcURL) {
                    //Image has a valid data-src and an invalid src
                    if (imageRendered) {
                        //If the placeholder has already been render, re-render it
                        prepareImageElement(options, engineSettings, imageAttr.dataSrc, image);
                    } else {
                        //If the placeholder has not been rendered, check if the image exists and render a fallback if it doesn't
                        (function(src, options, engineSettings, dataSrc, image) {
                            utils.imageExists(src, function(exists) {
                                if (!exists) {
                                    prepareImageElement(options, engineSettings, dataSrc, image);
                                }
                            });
                        })(imageAttr.src, options, engineSettings, imageAttr.dataSrc, image);
                    }
                }
            } else if (imageHasDataSrcURL) {
                prepareImageElement(options, engineSettings, imageAttr.dataSrc, image);
            }
        });

        return this;
    }
};

var App = {
    settings: {
        domain: 'holder.js',
        images: 'img',
        objects: 'object',
        bgnodes: 'body .holderjs',
        stylenodes: 'head link.holderjs',
        themes: {
            'gray': {
                bg: '#EEEEEE',
                fg: '#AAAAAA'
            },
            'social': {
                bg: '#3a5a97',
                fg: '#FFFFFF'
            },
            'industrial': {
                bg: '#434A52',
                fg: '#C2F200'
            },
            'sky': {
                bg: '#0D8FDB',
                fg: '#FFFFFF'
            },
            'vine': {
                bg: '#39DBAC',
                fg: '#1E292C'
            },
            'lava': {
                bg: '#F8591A',
                fg: '#1C2846'
            }
        }
    },
    defaults: {
        size: 10,
        units: 'pt',
        scale: 1 / 16
    }
};

/**
 * Processes provided source attribute and sets up the appropriate rendering workflow
 *
 * @private
 * @param options Instance options from Holder.run
 * @param renderSettings Instance configuration
 * @param src Image URL
 * @param el Image DOM element
 */
function prepareImageElement(options, engineSettings, src, el) {
    var holderFlags = parseURL(src.substr(src.lastIndexOf(options.domain)), options);
    if (holderFlags) {
        prepareDOMElement({
            mode: null,
            el: el,
            flags: holderFlags,
            engineSettings: engineSettings
        });
    }
}

/**
 * Processes a Holder URL and extracts configuration from query string
 *
 * @private
 * @param url URL
 * @param instanceOptions Instance options from Holder.run
 */
function parseURL(url, instanceOptions) {
    var holder = {
        theme: extend(App.settings.themes.gray, null),
        stylesheets: instanceOptions.stylesheets,
        instanceOptions: instanceOptions
    };

    var firstQuestionMark = url.indexOf('?');
    var parts = [url];

    if (firstQuestionMark !== -1) {
        parts = [url.slice(0, firstQuestionMark), url.slice(firstQuestionMark + 1)];
    }

    var basics = parts[0].split('/');

    holder.holderURL = url;

    var dimensions = basics[1];
    var dimensionData = dimensions.match(/([\d]+p?)x([\d]+p?)/);

    if (!dimensionData) return false;

    holder.fluid = dimensions.indexOf('p') !== -1;

    holder.dimensions = {
        width: dimensionData[1].replace('p', '%'),
        height: dimensionData[2].replace('p', '%')
    };

    if (parts.length === 2) {
        var options = querystring.parse(parts[1]);

        // Dimensions

        if (utils.truthy(options.ratio)) {
            holder.fluid = true;
            var ratioWidth = parseFloat(holder.dimensions.width.replace('%', ''));
            var ratioHeight = parseFloat(holder.dimensions.height.replace('%', ''));

            ratioHeight = Math.floor(100 * (ratioHeight / ratioWidth));
            ratioWidth = 100;

            holder.dimensions.width = ratioWidth + '%';
            holder.dimensions.height = ratioHeight + '%';
        }

        holder.auto = utils.truthy(options.auto);

        // Colors

        if (options.bg) {
            holder.theme.bg = utils.parseColor(options.bg);
        }

        if (options.fg) {
            holder.theme.fg = utils.parseColor(options.fg);
        }

        //todo: add automatic foreground to themes without foreground
        if (options.bg && !options.fg) {
            holder.autoFg = true;
        }

        if (options.theme && holder.instanceOptions.themes.hasOwnProperty(options.theme)) {
            holder.theme = extend(holder.instanceOptions.themes[options.theme], null);
        }

        // Text

        if (options.text) {
            holder.text = options.text;
        }

        if (options.textmode) {
            holder.textmode = options.textmode;
        }

        if (options.size && parseFloat(options.size)) {
            holder.size = parseFloat(options.size);
        }

        if (options.font) {
            holder.font = options.font;
        }

        if (options.align) {
            holder.align = options.align;
        }

        if (options.lineWrap) {
            holder.lineWrap = options.lineWrap;
        }

        holder.nowrap = utils.truthy(options.nowrap);

        // Miscellaneous

        holder.outline = utils.truthy(options.outline);

        if (utils.truthy(options.random)) {
            App.vars.cache.themeKeys = App.vars.cache.themeKeys || Object.keys(holder.instanceOptions.themes);
            var _theme = App.vars.cache.themeKeys[0 | Math.random() * App.vars.cache.themeKeys.length];
            holder.theme = extend(holder.instanceOptions.themes[_theme], null);
        }
    }

    return holder;
}

/**
 * Modifies the DOM to fit placeholders and sets up resizable image callbacks (for fluid and automatically sized placeholders)
 *
 * @private
 * @param settings DOM prep settings
 */
function prepareDOMElement(prepSettings) {
    var mode = prepSettings.mode;
    var el = prepSettings.el;
    var flags = prepSettings.flags;
    var _engineSettings = prepSettings.engineSettings;
    var dimensions = flags.dimensions,
        theme = flags.theme;
    var dimensionsCaption = dimensions.width + 'x' + dimensions.height;
    mode = mode == null ? (flags.fluid ? 'fluid' : 'image') : mode;
    var holderTemplateRe = /holder_([a-z]+)/g;
    var dimensionsInText = false;

    if (flags.text != null) {
        theme.text = flags.text;

        //<object> SVG embedding doesn't parse Unicode properly
        if (el.nodeName.toLowerCase() === 'object') {
            var textLines = theme.text.split('\\n');
            for (var k = 0; k < textLines.length; k++) {
                textLines[k] = utils.encodeHtmlEntity(textLines[k]);
            }
            theme.text = textLines.join('\\n');
        }
    }

    if (theme.text) {
        var holderTemplateMatches = theme.text.match(holderTemplateRe);

        if (holderTemplateMatches !== null) {
            //todo: optimize template replacement
            holderTemplateMatches.forEach(function (match) {
                if (match === 'holder_dimensions') {
                    theme.text = theme.text.replace(match, dimensionsCaption);
                }
            });
        }
    }

    var holderURL = flags.holderURL;
    var engineSettings = extend(_engineSettings, null);

    if (flags.font) {
        /*
        If external fonts are used in a <img> placeholder rendered with SVG, Holder falls back to canvas.

        This is done because Firefox and Chrome disallow embedded SVGs from referencing external assets.
        The workaround is either to change the placeholder tag from <img> to <object> or to use the canvas renderer.
        */
        theme.font = flags.font;
        if (!engineSettings.noFontFallback && el.nodeName.toLowerCase() === 'img' && App.setup.supportsCanvas && engineSettings.renderer === 'svg') {
            engineSettings = extend(engineSettings, {
                renderer: 'canvas'
            });
        }
    }

    //Chrome and Opera require a quick 10ms re-render if web fonts are used with canvas
    if (flags.font && engineSettings.renderer == 'canvas') {
        engineSettings.reRender = true;
    }

    if (mode == 'background') {
        if (el.getAttribute('data-background-src') == null) {
            DOM.setAttr(el, {
                'data-background-src': holderURL
            });
        }
    } else {
        var domProps = {};
        domProps[App.vars.dataAttr] = holderURL;
        DOM.setAttr(el, domProps);
    }

    flags.theme = theme;

    //todo consider using all renderSettings in holderData
    el.holderData = {
        flags: flags,
        engineSettings: engineSettings
    };

    if (mode == 'image' || mode == 'fluid') {
        DOM.setAttr(el, {
            'alt': theme.text ? (dimensionsInText ? theme.text : theme.text + ' [' + dimensionsCaption + ']') : dimensionsCaption
        });
    }

    var renderSettings = {
        mode: mode,
        el: el,
        holderSettings: {
            dimensions: dimensions,
            theme: theme,
            flags: flags
        },
        engineSettings: engineSettings
    };

    if (mode == 'image') {
        if (!flags.auto) {
            el.style.width = dimensions.width + 'px';
            el.style.height = dimensions.height + 'px';
        }

        if (engineSettings.renderer == 'html') {
            el.style.backgroundColor = theme.bg;
        } else {
            render(renderSettings);

            if (flags.textmode == 'exact') {
                el.holderData.resizeUpdate = true;
                App.vars.resizableImages.push(el);
                updateResizableElements(el);
            }
        }
    } else if (mode == 'background' && engineSettings.renderer != 'html') {
        render(renderSettings);
    } else if (mode == 'fluid') {
        el.holderData.resizeUpdate = true;

        if (dimensions.height.slice(-1) == '%') {
            el.style.height = dimensions.height;
        } else if (flags.auto == null || !flags.auto) {
            el.style.height = dimensions.height + 'px';
        }
        if (dimensions.width.slice(-1) == '%') {
            el.style.width = dimensions.width;
        } else if (flags.auto == null || !flags.auto) {
            el.style.width = dimensions.width + 'px';
        }
        if (el.style.display == 'inline' || el.style.display === '' || el.style.display == 'none') {
            el.style.display = 'block';
        }

        setInitialDimensions(el);

        if (engineSettings.renderer == 'html') {
            el.style.backgroundColor = theme.bg;
        } else {
            App.vars.resizableImages.push(el);
            updateResizableElements(el);
        }
    }
}

/**
 * Core function that takes output from renderers and sets it as the source or background-image of the target element
 *
 * @private
 * @param renderSettings Renderer settings
 */
function render(renderSettings) {
    var image = null;
    var mode = renderSettings.mode;
    var el = renderSettings.el;
    var holderSettings = renderSettings.holderSettings;
    var engineSettings = renderSettings.engineSettings;

    switch (engineSettings.renderer) {
        case 'svg':
            if (!App.setup.supportsSVG) return;
            break;
        case 'canvas':
            if (!App.setup.supportsCanvas) return;
            break;
        default:
            return;
    }

    //todo: move generation of scene up to flag generation to reduce extra object creation
    var scene = {
        width: holderSettings.dimensions.width,
        height: holderSettings.dimensions.height,
        theme: holderSettings.theme,
        flags: holderSettings.flags
    };

    var sceneGraph = buildSceneGraph(scene);

    function getRenderedImage() {
        var image = null;
        switch (engineSettings.renderer) {
            case 'canvas':
                image = sgCanvasRenderer(sceneGraph, renderSettings);
                break;
            case 'svg':
                image = svgRenderer(sceneGraph, renderSettings);
                break;
            default:
                throw 'Holder: invalid renderer: ' + engineSettings.renderer;
        }

        return image;
    }

    image = getRenderedImage();

    if (image == null) {
        throw 'Holder: couldn\'t render placeholder';
    }

    //todo: add <object> canvas rendering
    if (mode == 'background') {
        el.style.backgroundImage = 'url(' + image + ')';

        if (!engineSettings.noBackgroundSize) {
            el.style.backgroundSize = scene.width + 'px ' + scene.height + 'px';
        }
    } else {
        if (el.nodeName.toLowerCase() === 'img') {
            DOM.setAttr(el, {
                'src': image
            });
        } else if (el.nodeName.toLowerCase() === 'object') {
            DOM.setAttr(el, {
                'data': image,
                'type': 'image/svg+xml'
            });
        }
        if (engineSettings.reRender) {
            global.setTimeout(function () {
                var image = getRenderedImage();
                if (image == null) {
                    throw 'Holder: couldn\'t render placeholder';
                }
                //todo: refactor this code into a function
                if (el.nodeName.toLowerCase() === 'img') {
                    DOM.setAttr(el, {
                        'src': image
                    });
                } else if (el.nodeName.toLowerCase() === 'object') {
                    DOM.setAttr(el, {
                        'data': image,
                        'type': 'image/svg+xml'
                    });
                }
            }, 150);
        }
    }
    //todo: account for re-rendering
    DOM.setAttr(el, {
        'data-holder-rendered': true
    });
}

/**
 * Core function that takes a Holder scene description and builds a scene graph
 *
 * @private
 * @param scene Holder scene object
 */
//todo: make this function reusable
//todo: merge app defaults and setup properties into the scene argument
function buildSceneGraph(scene) {
    var fontSize = App.defaults.size;
    if (parseFloat(scene.theme.size)) {
        fontSize = scene.theme.size;
    } else if (parseFloat(scene.flags.size)) {
        fontSize = scene.flags.size;
    }

    scene.font = {
        family: scene.theme.font ? scene.theme.font : 'Arial, Helvetica, Open Sans, sans-serif',
        size: textSize(scene.width, scene.height, fontSize, App.defaults.scale),
        units: scene.theme.units ? scene.theme.units : App.defaults.units,
        weight: scene.theme.fontweight ? scene.theme.fontweight : 'bold'
    };

    scene.text = scene.theme.text || Math.floor(scene.width) + 'x' + Math.floor(scene.height);

    scene.noWrap = scene.theme.nowrap || scene.flags.nowrap;

    scene.align = scene.theme.align || scene.flags.align || 'center';

    switch (scene.flags.textmode) {
        case 'literal':
            scene.text = scene.flags.dimensions.width + 'x' + scene.flags.dimensions.height;
            break;
        case 'exact':
            if (!scene.flags.exactDimensions) break;
            scene.text = Math.floor(scene.flags.exactDimensions.width) + 'x' + Math.floor(scene.flags.exactDimensions.height);
            break;
    }

    var lineWrap = scene.flags.lineWrap || App.setup.lineWrapRatio;
    var sceneMargin = scene.width * lineWrap;
    var maxLineWidth = sceneMargin;

    var sceneGraph = new SceneGraph({
        width: scene.width,
        height: scene.height
    });

    var Shape = sceneGraph.Shape;

    var holderBg = new Shape.Rect('holderBg', {
        fill: scene.theme.bg
    });

    holderBg.resize(scene.width, scene.height);
    sceneGraph.root.add(holderBg);

    if (scene.flags.outline) {
        var outlineColor = new Color(holderBg.properties.fill);
        outlineColor = outlineColor.lighten(outlineColor.lighterThan('7f7f7f') ? -0.1 : 0.1);
        holderBg.properties.outline = {
            fill: outlineColor.toHex(true),
            width: 2
        };
    }

    var holderTextColor = scene.theme.fg;

    if (scene.flags.autoFg) {
        var holderBgColor = new Color(holderBg.properties.fill);
        var lightColor = new Color('fff');
        var darkColor = new Color('000', {
            'alpha': 0.285714
        });

        holderTextColor = holderBgColor.blendAlpha(holderBgColor.lighterThan('7f7f7f') ? darkColor : lightColor).toHex(true);
    }

    var holderTextGroup = new Shape.Group('holderTextGroup', {
        text: scene.text,
        align: scene.align,
        font: scene.font,
        fill: holderTextColor
    });

    holderTextGroup.moveTo(null, null, 1);
    sceneGraph.root.add(holderTextGroup);

    var tpdata = holderTextGroup.textPositionData = stagingRenderer(sceneGraph);
    if (!tpdata) {
        throw 'Holder: staging fallback not supported yet.';
    }
    holderTextGroup.properties.leading = tpdata.boundingBox.height;

    var textNode = null;
    var line = null;

    function finalizeLine(parent, line, width, height) {
        line.width = width;
        line.height = height;
        parent.width = Math.max(parent.width, line.width);
        parent.height += line.height;
    }

    if (tpdata.lineCount > 1) {
        var offsetX = 0;
        var offsetY = 0;
        var lineIndex = 0;
        var lineKey;
        line = new Shape.Group('line' + lineIndex);

        //Double margin so that left/right-aligned next is not flush with edge of image
        if (scene.align === 'left' || scene.align === 'right') {
            maxLineWidth = scene.width * (1 - (1 - lineWrap) * 2);
        }

        for (var i = 0; i < tpdata.words.length; i++) {
            var word = tpdata.words[i];
            textNode = new Shape.Text(word.text);
            var newline = word.text == '\\n';
            if (!scene.noWrap && (offsetX + word.width >= maxLineWidth || newline === true)) {
                finalizeLine(holderTextGroup, line, offsetX, holderTextGroup.properties.leading);
                holderTextGroup.add(line);
                offsetX = 0;
                offsetY += holderTextGroup.properties.leading;
                lineIndex += 1;
                line = new Shape.Group('line' + lineIndex);
                line.y = offsetY;
            }
            if (newline === true) {
                continue;
            }
            textNode.moveTo(offsetX, 0);
            offsetX += tpdata.spaceWidth + word.width;
            line.add(textNode);
        }

        finalizeLine(holderTextGroup, line, offsetX, holderTextGroup.properties.leading);
        holderTextGroup.add(line);

        if (scene.align === 'left') {
            holderTextGroup.moveTo(scene.width - sceneMargin, null, null);
        } else if (scene.align === 'right') {
            for (lineKey in holderTextGroup.children) {
                line = holderTextGroup.children[lineKey];
                line.moveTo(scene.width - line.width, null, null);
            }

            holderTextGroup.moveTo(0 - (scene.width - sceneMargin), null, null);
        } else {
            for (lineKey in holderTextGroup.children) {
                line = holderTextGroup.children[lineKey];
                line.moveTo((holderTextGroup.width - line.width) / 2, null, null);
            }

            holderTextGroup.moveTo((scene.width - holderTextGroup.width) / 2, null, null);
        }

        holderTextGroup.moveTo(null, (scene.height - holderTextGroup.height) / 2, null);

        //If the text exceeds vertical space, move it down so the first line is visible
        if ((scene.height - holderTextGroup.height) / 2 < 0) {
            holderTextGroup.moveTo(null, 0, null);
        }
    } else {
        textNode = new Shape.Text(scene.text);
        line = new Shape.Group('line0');
        line.add(textNode);
        holderTextGroup.add(line);

        if (scene.align === 'left') {
            holderTextGroup.moveTo(scene.width - sceneMargin, null, null);
        } else if (scene.align === 'right') {
            holderTextGroup.moveTo(0 - (scene.width - sceneMargin), null, null);
        } else {
            holderTextGroup.moveTo((scene.width - tpdata.boundingBox.width) / 2, null, null);
        }

        holderTextGroup.moveTo(null, (scene.height - tpdata.boundingBox.height) / 2, null);
    }

    //todo: renderlist
    return sceneGraph;
}

/**
 * Adaptive text sizing function
 *
 * @private
 * @param width Parent width
 * @param height Parent height
 * @param fontSize Requested text size
 * @param scale Proportional scale of text
 */
function textSize(width, height, fontSize, scale) {
    var stageWidth = parseInt(width, 10);
    var stageHeight = parseInt(height, 10);

    var bigSide = Math.max(stageWidth, stageHeight);
    var smallSide = Math.min(stageWidth, stageHeight);

    var newHeight = 0.8 * Math.min(smallSide, bigSide * scale);
    return Math.round(Math.max(fontSize, newHeight));
}

/**
 * Iterates over resizable (fluid or auto) placeholders and renders them
 *
 * @private
 * @param element Optional element selector, specified only if a specific element needs to be re-rendered
 */
function updateResizableElements(element) {
    var images;
    if (element == null || element.nodeType == null) {
        images = App.vars.resizableImages;
    } else {
        images = [element];
    }
    for (var i = 0, l = images.length; i < l; i++) {
        var el = images[i];
        if (el.holderData) {
            var flags = el.holderData.flags;
            var dimensions = dimensionCheck(el);
            if (dimensions) {
                if (!el.holderData.resizeUpdate) {
                    continue;
                }

                if (flags.fluid && flags.auto) {
                    var fluidConfig = el.holderData.fluidConfig;
                    switch (fluidConfig.mode) {
                        case 'width':
                            dimensions.height = dimensions.width / fluidConfig.ratio;
                            break;
                        case 'height':
                            dimensions.width = dimensions.height * fluidConfig.ratio;
                            break;
                    }
                }

                var settings = {
                    mode: 'image',
                    holderSettings: {
                        dimensions: dimensions,
                        theme: flags.theme,
                        flags: flags
                    },
                    el: el,
                    engineSettings: el.holderData.engineSettings
                };

                if (flags.textmode == 'exact') {
                    flags.exactDimensions = dimensions;
                    settings.holderSettings.dimensions = flags.dimensions;
                }

                render(settings);
            } else {
                setInvisible(el);
            }
        }
    }
}

/**
 * Sets up aspect ratio metadata for fluid placeholders, in order to preserve proportions when resizing
 *
 * @private
 * @param el Image DOM element
 */
function setInitialDimensions(el) {
    if (el.holderData) {
        var dimensions = dimensionCheck(el);
        if (dimensions) {
            var flags = el.holderData.flags;

            var fluidConfig = {
                fluidHeight: flags.dimensions.height.slice(-1) == '%',
                fluidWidth: flags.dimensions.width.slice(-1) == '%',
                mode: null,
                initialDimensions: dimensions
            };

            if (fluidConfig.fluidWidth && !fluidConfig.fluidHeight) {
                fluidConfig.mode = 'width';
                fluidConfig.ratio = fluidConfig.initialDimensions.width / parseFloat(flags.dimensions.height);
            } else if (!fluidConfig.fluidWidth && fluidConfig.fluidHeight) {
                fluidConfig.mode = 'height';
                fluidConfig.ratio = parseFloat(flags.dimensions.width) / fluidConfig.initialDimensions.height;
            }

            el.holderData.fluidConfig = fluidConfig;
        } else {
            setInvisible(el);
        }
    }
}

/**
 * Iterates through all current invisible images, and if they're visible, renders them and removes them from further checks. Runs every animation frame.
 *
 * @private
 */
function visibilityCheck() {
    var renderableImages = [];
    var keys = Object.keys(App.vars.invisibleImages);
    var el;

    keys.forEach(function (key) {
        el = App.vars.invisibleImages[key];
        if (dimensionCheck(el) && el.nodeName.toLowerCase() == 'img') {
            renderableImages.push(el);
            delete App.vars.invisibleImages[key];
        }
    });

    if (renderableImages.length) {
        Holder.run({
            images: renderableImages
        });
    }

    // Done to prevent 100% CPU usage via aggressive calling of requestAnimationFrame
    setTimeout(function () {
        global.requestAnimationFrame(visibilityCheck);
    }, 10);
}

/**
 * Starts checking for invisible placeholders if not doing so yet. Does nothing otherwise.
 *
 * @private
 */
function startVisibilityCheck() {
    if (!App.vars.visibilityCheckStarted) {
        global.requestAnimationFrame(visibilityCheck);
        App.vars.visibilityCheckStarted = true;
    }
}

/**
 * Sets a unique ID for an image detected to be invisible and adds it to the map of invisible images checked by visibilityCheck
 *
 * @private
 * @param el Invisible DOM element
 */
function setInvisible(el) {
    if (!el.holderData.invisibleId) {
        App.vars.invisibleId += 1;
        App.vars.invisibleImages['i' + App.vars.invisibleId] = el;
        el.holderData.invisibleId = App.vars.invisibleId;
    }
}

//todo: see if possible to convert stagingRenderer to use HTML only
var stagingRenderer = (function() {
    var svg = null,
        stagingText = null,
        stagingTextNode = null;
    return function(graph) {
        var rootNode = graph.root;
        if (App.setup.supportsSVG) {
            var firstTimeSetup = false;
            var tnode = function(text) {
                return document.createTextNode(text);
            };
            if (svg == null || svg.parentNode !== document.body) {
                firstTimeSetup = true;
            }

            svg = SVG.initSVG(svg, rootNode.properties.width, rootNode.properties.height);
            //Show staging element before staging
            svg.style.display = 'block';

            if (firstTimeSetup) {
                stagingText = DOM.newEl('text', SVG_NS);
                stagingTextNode = tnode(null);
                DOM.setAttr(stagingText, {
                    x: 0
                });
                stagingText.appendChild(stagingTextNode);
                svg.appendChild(stagingText);
                document.body.appendChild(svg);
                svg.style.visibility = 'hidden';
                svg.style.position = 'absolute';
                svg.style.top = '-100%';
                svg.style.left = '-100%';
                //todo: workaround for zero-dimension <svg> tag in Opera 12
                //svg.setAttribute('width', 0);
                //svg.setAttribute('height', 0);
            }

            var holderTextGroup = rootNode.children.holderTextGroup;
            var htgProps = holderTextGroup.properties;
            DOM.setAttr(stagingText, {
                'y': htgProps.font.size,
                'style': utils.cssProps({
                    'font-weight': htgProps.font.weight,
                    'font-size': htgProps.font.size + htgProps.font.units,
                    'font-family': htgProps.font.family
                })
            });

            //Unescape HTML entities to get approximately the right width
            var txt = DOM.newEl('textarea');
            txt.innerHTML = htgProps.text;
            stagingTextNode.nodeValue = txt.value;

            //Get bounding box for the whole string (total width and height)
            var stagingTextBBox = stagingText.getBBox();

            //Get line count and split the string into words
            var lineCount = Math.ceil(stagingTextBBox.width / rootNode.properties.width);
            var words = htgProps.text.split(' ');
            var newlines = htgProps.text.match(/\\n/g);
            lineCount += newlines == null ? 0 : newlines.length;

            //Get bounding box for the string with spaces removed
            stagingTextNode.nodeValue = htgProps.text.replace(/[ ]+/g, '');
            var computedNoSpaceLength = stagingText.getComputedTextLength();

            //Compute average space width
            var diffLength = stagingTextBBox.width - computedNoSpaceLength;
            var spaceWidth = Math.round(diffLength / Math.max(1, words.length - 1));

            //Get widths for every word with space only if there is more than one line
            var wordWidths = [];
            if (lineCount > 1) {
                stagingTextNode.nodeValue = '';
                for (var i = 0; i < words.length; i++) {
                    if (words[i].length === 0) continue;
                    stagingTextNode.nodeValue = utils.decodeHtmlEntity(words[i]);
                    var bbox = stagingText.getBBox();
                    wordWidths.push({
                        text: words[i],
                        width: bbox.width
                    });
                }
            }

            //Hide staging element after staging
            svg.style.display = 'none';

            return {
                spaceWidth: spaceWidth,
                lineCount: lineCount,
                boundingBox: stagingTextBBox,
                words: wordWidths
            };
        } else {
            //todo: canvas fallback for measuring text on android 2.3
            return false;
        }
    };
})();

//Helpers

/**
 * Prevents a function from being called too often, waits until a timer elapses to call it again
 *
 * @param fn Function to call
 */
function debounce(fn) {
    if (!App.vars.debounceTimer) fn.call(this);
    if (App.vars.debounceTimer) global.clearTimeout(App.vars.debounceTimer);
    App.vars.debounceTimer = global.setTimeout(function() {
        App.vars.debounceTimer = null;
        fn.call(this);
    }, App.setup.debounce);
}

/**
 * Holder-specific resize/orientation change callback, debounced to prevent excessive execution
 */
function resizeEvent() {
    debounce(function() {
        updateResizableElements(null);
    });
}

//Set up flags

for (var flag in App.flags) {
    if (!App.flags.hasOwnProperty(flag)) continue;
    App.flags[flag].match = function(val) {
        return val.match(this.regex);
    };
}

//Properties set once on setup

App.setup = {
    renderer: 'html',
    debounce: 100,
    ratio: 1,
    supportsCanvas: false,
    supportsSVG: false,
    lineWrapRatio: 0.9,
    dataAttr: 'data-src',
    renderers: ['html', 'canvas', 'svg']
};

//Properties modified during runtime

App.vars = {
    preempted: false,
    resizableImages: [],
    invisibleImages: {},
    invisibleId: 0,
    visibilityCheckStarted: false,
    debounceTimer: null,
    cache: {}
};

//Pre-flight

(function() {
    var canvas = DOM.newEl('canvas');

    if (canvas.getContext) {
        if (canvas.toDataURL('image/png').indexOf('data:image/png') != -1) {
            App.setup.renderer = 'canvas';
            App.setup.supportsCanvas = true;
        }
    }

    if (!!document.createElementNS && !!document.createElementNS(SVG_NS, 'svg').createSVGRect) {
        App.setup.renderer = 'svg';
        App.setup.supportsSVG = true;
    }
})();

//Starts checking for invisible placeholders
startVisibilityCheck();

if (onDomReady) {
    onDomReady(function() {
        if (!App.vars.preempted) {
            Holder.run();
        }
        if (global.addEventListener) {
            global.addEventListener('resize', resizeEvent, false);
            global.addEventListener('orientationchange', resizeEvent, false);
        } else {
            global.attachEvent('onresize', resizeEvent);
        }

        if (typeof global.Turbolinks == 'object') {
            global.document.addEventListener('page:change', function() {
                Holder.run();
            });
        }
    });
}

module.exports = Holder;
