/*
Holder.js - client side image placeholders
© 2012-2015 Ivan Malopinsky - http://imsky.co
*/

//Libraries and functions
var onDomReady = require('./lib/ondomready');
var SceneGraph = require('./scenegraph');
var utils = require('./utils');
var querystring = require('./lib/querystring');

var extend = utils.extend;
var getNodeArray = utils.getNodeArray;
var dimensionCheck = utils.dimensionCheck;

//Constants and definitions
var SVG_NS = 'http://www.w3.org/2000/svg';
var NODE_TYPE_COMMENT = 8;
var version = '%version%';
var generatorComment = '\n' +
    'Created with Holder.js ' + version + '.\n' +
    'Learn more at http://holderjs.com\n' +
    '(c) 2012-2015 Ivan Malopinsky - http://imsky.co\n';

var Holder = {
    version: version,

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
     * @param {string} el Selector of target element(s)
     */
    addImage: function(src, el) {
        var node = document.querySelectorAll(el);
        if (node.length) {
            for (var i = 0, l = node.length; i < l; i++) {
                var img = newEl('img');
                var domProps = {};
                domProps[App.vars.dataAttr] = src;
                setAttr(img, domProps);
                node[i].appendChild(img);
            }
        }
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
        userOptions = userOptions || {};
        var engineSettings = {};
        var options = extend(App.settings, userOptions);

        App.vars.preempted = true;
        App.vars.dataAttr = options.dataAttr || App.vars.dataAttr;

        engineSettings.renderer = options.renderer ? options.renderer : App.setup.renderer;
        if (App.setup.renderers.join(',').indexOf(engineSettings.renderer) === -1) {
            engineSettings.renderer = App.setup.supportsSVG ? 'svg' : (App.setup.supportsCanvas ? 'canvas' : 'html');
        }

        var images = getNodeArray(options.images);
        var bgnodes = getNodeArray(options.bgnodes);
        var stylenodes = getNodeArray(options.stylenodes);
        var objects = getNodeArray(options.objects);

        engineSettings.stylesheets = [];
        engineSettings.svgXMLStylesheet = true;
        engineSettings.noFontFallback = options.noFontFallback ? options.noFontFallback : false;

        for (var i = 0; i < stylenodes.length; i++) {
            var styleNode = stylenodes[i];
            if (styleNode.attributes.rel && styleNode.attributes.href && styleNode.attributes.rel.value == 'stylesheet') {
                var href = styleNode.attributes.href.value;
                //todo: write isomorphic relative-to-absolute URL function
                var proxyLink = newEl('a');
                proxyLink.href = href;
                var stylesheetURL = proxyLink.protocol + '//' + proxyLink.host + proxyLink.pathname + proxyLink.search;
                engineSettings.stylesheets.push(stylesheetURL);
            }
        }

        for (i = 0; i < bgnodes.length; i++) {
            //Skip processing background nodes if getComputedStyle is unavailable, since only modern browsers would be able to use canvas or SVG to render to background
            if (!global.getComputedStyle) continue;
            var backgroundImage = global.getComputedStyle(bgnodes[i], null).getPropertyValue('background-image');
            var dataBackgroundImage = bgnodes[i].getAttribute('data-background-src');
            var rawURL = null;

            if (dataBackgroundImage == null) {
                rawURL = backgroundImage;
            } else {
                rawURL = dataBackgroundImage;
            }

            var holderURL = null;
            var holderString = '?' + options.domain + '/';

            if (rawURL.indexOf(holderString) === 0) {
                holderURL = rawURL.slice(1);
            } else if (rawURL.indexOf(holderString) != -1) {
                var fragment = rawURL.substr(rawURL.indexOf(holderString)).slice(1);
                var fragmentMatch = fragment.match(/([^\"]*)"?\)/);

                if (fragmentMatch != null) {
                    holderURL = fragmentMatch[1];
                }
            }

            if (holderURL != null) {
                var holderFlags = parseURL(holderURL, options);
                if (holderFlags) {
                    prepareDOMElement({
                        mode: 'background',
                        el: bgnodes[i],
                        flags: holderFlags,
                        engineSettings: engineSettings
                    });
                }
            }
        }

        for (i = 0; i < objects.length; i++) {
            var object = objects[i];
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
        }

        for (i = 0; i < images.length; i++) {
            var image = images[i];
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
        }

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
        stylesheets: [],
        themes: {
            'gray': {
                background: '#EEEEEE',
                foreground: '#AAAAAA'
            },
            'social': {
                background: '#3a5a97',
                foreground: '#FFFFFF'
            },
            'industrial': {
                background: '#434A52',
                foreground: '#C2F200'
            },
            'sky': {
                background: '#0D8FDB',
                foreground: '#FFFFFF'
            },
            'vine': {
                background: '#39DBAC',
                foreground: '#1E292C'
            },
            'lava': {
                background: '#F8591A',
                foreground: '#1C2846'
            }
        }
    },
    defaults: {
        size: 10,
        units: 'pt',
        scale: 1 / 16
    },
    //todo: remove in 2.8
    flags: {
        dimensions: {
            regex: /^(\d+)x(\d+)$/,
            output: function(val) {
                var exec = this.regex.exec(val);
                return {
                    width: +exec[1],
                    height: +exec[2]
                };
            }
        },
        fluid: {
            regex: /^([0-9]+%?)x([0-9]+%?)$/,
            output: function(val) {
                var exec = this.regex.exec(val);
                return {
                    width: exec[1],
                    height: exec[2]
                };
            }
        },
        colors: {
            regex: /(?:#|\^)([0-9a-f]{3,})\:(?:#|\^)([0-9a-f]{3,})/i,
            output: function(val) {
                var exec = this.regex.exec(val);
                return {
                    foreground: '#' + exec[2],
                    background: '#' + exec[1]
                };
            }
        },
        text: {
            regex: /text\:(.*)/,
            output: function(val) {
                return this.regex.exec(val)[1].replace('\\/', '/');
            }
        },
        font: {
            regex: /font\:(.*)/,
            output: function(val) {
                return this.regex.exec(val)[1];
            }
        },
        auto: {
            regex: /^auto$/
        },
        textmode: {
            regex: /textmode\:(.*)/,
            output: function(val) {
                return this.regex.exec(val)[1];
            }
        },
        random: {
            regex: /^random$/
        },
        size: {
            regex: /size\:(\d+)/,
            output: function(val) {
                return this.regex.exec(val)[1];
            }
        }
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
 * Processes a Holder URL
 *
 * @private
 * @param url URL
 * @param options Instance options from Holder.run
 */
function parseURL(url, options) {
    var holder = {
        theme: extend(App.settings.themes.gray, null),
        stylesheets: options.stylesheets,
        instanceOptions: options
    };

    if (url.match(/([\d]+p?)x([\d]+p?)(?:\?|$)/)) {
        return parseQueryString(url, holder);
    } else {
        return parseFlags(url, holder);
    }
}

/**
 * Processes a Holder URL and extracts configuration from query string
 *
 * @private
 * @param url URL
 * @param holder Staging Holder object
 */
function parseQueryString(url, holder) {
    var parts = url.split('?');
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

        // Colors

        if (options.bg) {
            holder.theme.background = (options.bg.indexOf('#') === -1 ? '#' : '') + options.bg;
        }

        if (options.fg) {
            holder.theme.foreground = (options.fg.indexOf('#') === -1 ? '#' : '') + options.fg;
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

        if (options.size) {
            holder.size = options.size;
        }

        if (options.font) {
            holder.font = options.font;
        }

        if (options.align) {
            holder.align = options.align;
        }

        holder.nowrap = utils.truthy(options.nowrap);

        // Miscellaneous

        holder.auto = utils.truthy(options.auto);

        if (utils.truthy(options.random)) {
            App.vars.cache.themeKeys = App.vars.cache.themeKeys || Object.keys(holder.instanceOptions.themes);
            var _theme = App.vars.cache.themeKeys[0 | Math.random() * App.vars.cache.themeKeys.length];
            holder.theme = extend(holder.instanceOptions.themes[_theme], null);
        }
    }

    return holder;
}

//todo: remove in 2.8
/**
 * Processes a Holder URL and extracts flags
 *
 * @private
 * @deprecated
 * @param url URL
 * @param holder Staging Holder object
 */
function parseFlags(url, holder) {
    var render = false;
    var vtab = String.fromCharCode(11);
    var flags = url.replace(/([^\\])\//g, '$1' + vtab).split(vtab);
    var uriRegex = /%[0-9a-f]{2}/gi;
    var options = holder.instanceOptions;

    holder.holderURL = [];

    for (var fl = flags.length, j = 0; j < fl; j++) {
        var flag = flags[j];
        if (flag.match(uriRegex)) {
            try {
                flag = decodeURIComponent(flag);
            } catch (e) {
                flag = flags[j];
            }
        }

        var push = false;

        if (App.flags.dimensions.match(flag)) {
            render = true;
            holder.dimensions = App.flags.dimensions.output(flag);
            push = true;
        } else if (App.flags.fluid.match(flag)) {
            render = true;
            holder.dimensions = App.flags.fluid.output(flag);
            holder.fluid = true;
            push = true;
        } else if (App.flags.textmode.match(flag)) {
            holder.textmode = App.flags.textmode.output(flag);
            push = true;
        } else if (App.flags.colors.match(flag)) {
            var colors = App.flags.colors.output(flag);
            holder.theme = extend(holder.theme, colors);
            push = true;
        } else if (options.themes[flag]) {
            //If a theme is specified, it will override custom colors
            if (options.themes.hasOwnProperty(flag)) {
                holder.theme = extend(options.themes[flag], null);
            }
            push = true;
        } else if (App.flags.font.match(flag)) {
            holder.font = App.flags.font.output(flag);
            push = true;
        } else if (App.flags.auto.match(flag)) {
            holder.auto = true;
            push = true;
        } else if (App.flags.text.match(flag)) {
            holder.text = App.flags.text.output(flag);
            push = true;
        } else if (App.flags.size.match(flag)) {
            holder.size = App.flags.size.output(flag);
            push = true;
        } else if (App.flags.random.match(flag)) {
            if (App.vars.cache.themeKeys == null) {
                App.vars.cache.themeKeys = Object.keys(options.themes);
            }
            var theme = App.vars.cache.themeKeys[0 | Math.random() * App.vars.cache.themeKeys.length];
            holder.theme = extend(options.themes[theme], null);
            push = true;
        }

        if (push) {
            holder.holderURL.push(flag);
        }
    }
    holder.holderURL.unshift(options.domain);
    holder.holderURL = holder.holderURL.join('/');
    return render ? holder : false;
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

    var holderURL = flags.holderURL;
    var engineSettings = extend(_engineSettings, null);

    if (flags.font) {
        theme.font = flags.font;
        //Only run the <canvas> webfont fallback if noFontFallback is false, if the node is not an image, and if canvas is supported
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
            setAttr(el, {
                'data-background-src': holderURL
            });
        }
    } else {
        var domProps = {};
        domProps[App.vars.dataAttr] = holderURL;
        setAttr(el, domProps);
    }

    flags.theme = theme;

    //todo consider using all renderSettings in holderData
    el.holderData = {
        flags: flags,
        engineSettings: engineSettings
    };

    if (mode == 'image' || mode == 'fluid') {
        setAttr(el, {
            'alt': (theme.text ? theme.text + ' [' + dimensionsCaption + ']' : dimensionsCaption)
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
        if (engineSettings.renderer == 'html' || !flags.auto) {
            el.style.width = dimensions.width + 'px';
            el.style.height = dimensions.height + 'px';
        }
        if (engineSettings.renderer == 'html') {
            el.style.backgroundColor = theme.background;
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
            el.style.backgroundColor = theme.background;
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
    var holderSettings = renderSettings.holderSettings;
    var el = renderSettings.el;
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
                image = sgSVGRenderer(sceneGraph, renderSettings);
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
        el.style.backgroundSize = scene.width + 'px ' + scene.height + 'px';
    } else {
        if (el.nodeName.toLowerCase() === 'img') {
            setAttr(el, {
                'src': image
            });
        } else if (el.nodeName.toLowerCase() === 'object') {
            setAttr(el, {
                'data': image
            });
            setAttr(el, {
                'type': 'image/svg+xml'
            });
        }
        if (engineSettings.reRender) {
            global.setTimeout(function() {
                var image = getRenderedImage();
                if (image == null) {
                    throw 'Holder: couldn\'t render placeholder';
                }
                //todo: refactor this code into a function
                if (el.nodeName.toLowerCase() === 'img') {
                    setAttr(el, {
                        'src': image
                    });
                } else if (el.nodeName.toLowerCase() === 'object') {
                    setAttr(el, {
                        'data': image
                    });
                    setAttr(el, {
                        'type': 'image/svg+xml'
                    });
                }
            }, 100);
        }
    }
    //todo: account for re-rendering
    setAttr(el, {
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
        size: textSize(scene.width, scene.height, fontSize),
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

    var sceneGraph = new SceneGraph({
        width: scene.width,
        height: scene.height
    });

    var Shape = sceneGraph.Shape;

    var holderBg = new Shape.Rect('holderBg', {
        fill: scene.theme.background
    });

    holderBg.resize(scene.width, scene.height);
    sceneGraph.root.add(holderBg);

    var holderTextGroup = new Shape.Group('holderTextGroup', {
        text: scene.text,
        align: scene.align,
        font: scene.font,
        fill: scene.theme.foreground
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

    var sceneMargin = scene.width * App.setup.lineWrapRatio;
    var maxLineWidth = sceneMargin;

    if (tpdata.lineCount > 1) {
        var offsetX = 0;
        var offsetY = 0;
        var lineIndex = 0;
        var lineKey;
        line = new Shape.Group('line' + lineIndex);

        //Double margin so that left/right-aligned next is not flush with edge of image
        if (scene.align === 'left' || scene.align === 'right') {
            maxLineWidth = scene.width * (1 - (1 - (App.setup.lineWrapRatio)) * 2);
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
 */
function textSize(width, height, fontSize) {
    var stageWidth = parseInt(width, 10);
    var stageHeight = parseInt(height, 10);

    var bigSide = Math.max(stageWidth, stageHeight);
    var smallSide = Math.min(stageWidth, stageHeight);

    var newHeight = 0.8 * Math.min(smallSide, bigSide * App.defaults.scale);
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
    for (var i = 0, l = keys.length; i < l; i++) {
        el = App.vars.invisibleImages[keys[i]];
        if (dimensionCheck(el) && el.nodeName.toLowerCase() == 'img') {
            renderableImages.push(el);
            delete App.vars.invisibleImages[keys[i]];
        }
    }

    if (renderableImages.length) {
        Holder.run({
            images: renderableImages
        });
    }

    global.requestAnimationFrame(visibilityCheck);
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

            svg = initSVG(svg, rootNode.properties.width, rootNode.properties.height);
            //Show staging element before staging
            svg.style.display = 'block';

            if (firstTimeSetup) {
                stagingText = newEl('text', SVG_NS);
                stagingTextNode = tnode(null);
                setAttr(stagingText, {
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
            setAttr(stagingText, {
                'y': htgProps.font.size,
                'style': utils.cssProps({
                    'font-weight': htgProps.font.weight,
                    'font-size': htgProps.font.size + htgProps.font.units,
                    'font-family': htgProps.font.family
                })
            });

            //Get bounding box for the whole string (total width and height)
            stagingTextNode.nodeValue = htgProps.text;
            var stagingTextBBox = stagingText.getBBox();

            //Get line count and split the string into words
            var lineCount = Math.ceil(stagingTextBBox.width / (rootNode.properties.width * App.setup.lineWrapRatio));
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

var sgCanvasRenderer = (function() {
    var canvas = newEl('canvas');
    var ctx = null;

    return function(sceneGraph) {
        if (ctx == null) {
            ctx = canvas.getContext('2d');
        }
        var root = sceneGraph.root;
        canvas.width = App.dpr(root.properties.width);
        canvas.height = App.dpr(root.properties.height);
        ctx.textBaseline = 'middle';

        ctx.fillStyle = root.children.holderBg.properties.fill;
        ctx.fillRect(0, 0, App.dpr(root.children.holderBg.width), App.dpr(root.children.holderBg.height));

        var textGroup = root.children.holderTextGroup;
        var tgProps = textGroup.properties;
        ctx.font = textGroup.properties.font.weight + ' ' + App.dpr(textGroup.properties.font.size) + textGroup.properties.font.units + ' ' + textGroup.properties.font.family + ', monospace';
        ctx.fillStyle = textGroup.properties.fill;

        for (var lineKey in textGroup.children) {
            var line = textGroup.children[lineKey];
            for (var wordKey in line.children) {
                var word = line.children[wordKey];
                var x = App.dpr(textGroup.x + line.x + word.x);
                var y = App.dpr(textGroup.y + line.y + word.y + (textGroup.properties.leading / 2));

                ctx.fillText(word.properties.text, x, y);
            }
        }

        return canvas.toDataURL('image/png');
    };
})();

var sgSVGRenderer = (function() {
    //Prevent IE <9 from initializing SVG renderer
    if (!global.XMLSerializer) return;
    var xml = createXML();
    var svg = initSVG(null, 0, 0);
    var bgEl = newEl('rect', SVG_NS);
    svg.appendChild(bgEl);

    //todo: create a reusable pool for textNodes, resize if more words present

    return function(sceneGraph, renderSettings) {
        var root = sceneGraph.root;

        initSVG(svg, root.properties.width, root.properties.height);

        var groups = svg.querySelectorAll('g');

        for (var i = 0; i < groups.length; i++) {
            groups[i].parentNode.removeChild(groups[i]);
        }

        var holderURL = renderSettings.holderSettings.flags.holderURL;
        var holderId = 'holder_' + (Number(new Date()) + 32768 + (0 | Math.random() * 32768)).toString(16);
        var sceneGroupEl = newEl('g', SVG_NS);
        var textGroup = root.children.holderTextGroup;
        var tgProps = textGroup.properties;
        var textGroupEl = newEl('g', SVG_NS);
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

        setAttr(sceneGroupEl, {
            id: holderId
        });

        svg.insertBefore(commentNode, svg.firstChild);
        styleEl.appendChild(holderCSS);

        sceneGroupEl.appendChild(bgEl);
        sceneGroupEl.appendChild(textGroupEl);
        svg.appendChild(sceneGroupEl);

        setAttr(bgEl, {
            'width': root.children.holderBg.width,
            'height': root.children.holderBg.height,
            'fill': root.children.holderBg.properties.fill
        });

        textGroup.y += tpdata.boundingBox.height * 0.8;

        for (var lineKey in textGroup.children) {
            var line = textGroup.children[lineKey];
            for (var wordKey in line.children) {
                var word = line.children[wordKey];
                var x = textGroup.x + line.x + word.x;
                var y = textGroup.y + line.y + word.y;

                var textEl = newEl('text', SVG_NS);
                var textNode = document.createTextNode(null);

                setAttr(textEl, {
                    'x': x,
                    'y': y
                });

                textNode.nodeValue = word.properties.text;
                textEl.appendChild(textNode);
                textGroupEl.appendChild(textEl);
            }
        }

        //todo: factor the background check up the chain, perhaps only return reference
        var svgString = svgStringToDataURI(serializeSVG(svg, renderSettings.engineSettings), renderSettings.mode === 'background');
        return svgString;
    };
})();

//Helpers

//todo: move svg-related helpers to a dedicated file

/**
 * Converts serialized SVG to a string suitable for data URI use
 * @param svgString Serialized SVG string
 * @param [base64] Use base64 encoding for data URI
 */
var svgStringToDataURI = function() {
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
 * Generic new DOM element function
 *
 * @private
 * @param tag Tag to create
 * @param namespace Optional namespace value
 */
function newEl(tag, namespace) {
    if (namespace == null) {
        return document.createElement(tag);
    } else {
        return document.createElementNS(namespace, tag);
    }
}

/**
 * Generic setAttribute function
 *
 * @private
 * @param el Reference to DOM element
 * @param attrs Object with attribute keys and values
 */
function setAttr(el, attrs) {
    for (var a in attrs) {
        el.setAttribute(a, attrs[a]);
    }
}

/**
 * Generic SVG element creation function
 *
 * @private
 * @param svg SVG context, set to null if new
 * @param width Document width
 * @param height Document height
 */
function initSVG(svg, width, height) {
    var defs, style;

    if (svg == null) {
        svg = newEl('svg', SVG_NS);
        defs = newEl('defs', SVG_NS);
        style = newEl('style', SVG_NS);
        setAttr(style, {
            'type': 'text/css'
        });
        defs.appendChild(style);
        svg.appendChild(defs);
    } else {
        style = svg.querySelector('style');
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

    setAttr(svg, {
        'width': width,
        'height': height,
        'viewBox': '0 0 ' + width + ' ' + height,
        'preserveAspectRatio': 'none'
    });

    return svg;
}

/**
 * Returns serialized SVG with XML processing instructions
 *
 * @private
 * @param svg SVG context
 * @param stylesheets CSS stylesheets to include
 */
function serializeSVG(svg, engineSettings) {
    if (!global.XMLSerializer) return;
    var serializer = new XMLSerializer();
    var svgCSS = '';
    var stylesheets = engineSettings.stylesheets;

    //External stylesheets: Processing Instruction method
    if (engineSettings.svgXMLStylesheet) {
        var xml = createXML();
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
}

/**
 * Creates a XML document
 * @private
 */
function createXML() {
    if (!global.DOMParser) return;
    return new DOMParser().parseFromString('<xml />', 'application/xml');
}

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
    renderers: ['html', 'canvas', 'svg']
};

App.dpr = function(val) {
    return val * App.setup.ratio;
};

//Properties modified during runtime

App.vars = {
    preempted: false,
    resizableImages: [],
    invisibleImages: {},
    invisibleId: 0,
    visibilityCheckStarted: false,
    debounceTimer: null,
    cache: {},
    dataAttr: 'data-src'
};

//Pre-flight

(function() {
    var devicePixelRatio = 1,
        backingStoreRatio = 1;

    var canvas = newEl('canvas');
    var ctx = null;

    if (canvas.getContext) {
        if (canvas.toDataURL('image/png').indexOf('data:image/png') != -1) {
            App.setup.renderer = 'canvas';
            ctx = canvas.getContext('2d');
            App.setup.supportsCanvas = true;
        }
    }

    if (App.setup.supportsCanvas) {
        devicePixelRatio = global.devicePixelRatio || 1;
        backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
    }

    App.setup.ratio = devicePixelRatio / backingStoreRatio;

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
