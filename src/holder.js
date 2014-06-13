/*
Holder.js - client side image placeholders
© 2012-2014 Ivan Malopinsky - http://imsky.co
*/
(function (register, global, undefined) {

	var app = {};

	var Holder = {
		addTheme: function (name, theme) {
			name != null && theme != null && (app.settings.themes[name] = theme);
			return this;
		},
		addImage: function (src, el) {
			var node = document.querySelectorAll(el);
			if (node.length) {
				for (var i = 0, l = node.length; i < l; i++) {
					var img = document.createElement('img')
					img.setAttribute('data-src', src);
					node[i].appendChild(img);
				}
			}
			return this;
		},
		run: function (instanceOptions) {
			var instanceConfig = extend({}, app.config)

			app.runtime.preempted = true;

			var options = extend(app.settings, instanceOptions),
				images = [],
				imageNodes = [],
				bgnodes = [];

			//< v2.4 API compatibility
			if (options.use_canvas) {
				instanceConfig.renderer = 'canvas';
			} else if (options.use_svg) {
				instanceConfig.renderer = 'svg';
			}

			if (typeof (options.images) == 'string') {
				imageNodes = document.querySelectorAll(options.images);
			} else if (window.NodeList && options.images instanceof window.NodeList) {
				imageNodes = options.images;
			} else if (window.Node && options.images instanceof window.Node) {
				imageNodes = [options.images];
			} else if (window.HTMLCollection && options.images instanceof window.HTMLCollection) {
				imageNodes = options.images
			}

			if (typeof (options.bgnodes) == 'string') {
				bgnodes = document.querySelectorAll(options.bgnodes);
			} else if (window.NodeList && options.elements instanceof window.NodeList) {
				bgnodes = options.bgnodes;
			} else if (window.Node && options.bgnodes instanceof window.Node) {
				bgnodes = [options.bgnodes];
			}
			for (i = 0, l = imageNodes.length; i < l; i++) images.push(imageNodes[i]);

			var cssregex = new RegExp(options.domain + '\/(.*?)"?\\)');
			for (var l = bgnodes.length, i = 0; i < l; i++) {
				var src = window.getComputedStyle(bgnodes[i], null).getPropertyValue('background-image');
				var flags = src.match(cssregex);
				var bgsrc = bgnodes[i].getAttribute('data-background-src');
				if (flags) {
					var holder = parseFlags(flags[1].split('/'), options);
					if (holder) {
						render('background', bgnodes[i], holder, src, instanceConfig);
					}
				} else if (bgsrc != null) {
					var holder = parseFlags(bgsrc.substr(bgsrc.lastIndexOf(options.domain) + options.domain.length + 1)
						.split('/'), options);
					if (holder) {
						render('background', bgnodes[i], holder, src, instanceConfig);
					}
				}
			}

			for (l = images.length, i = 0; i < l; i++) {
				(function (image, options, instanceConfig) {
					var attr_data_src, attr_src;
					attr_src = attr_data_src = src = null;
					var attr_rendered = null;

					try {
						attr_src = image.getAttribute('src');
						attr_datasrc = image.getAttribute('data-src');
						attr_rendered = image.getAttribute('data-holder-rendered');
					} catch (e) {}

					var hasSrc = attr_src != null;
					var hasDataSrc = attr_datasrc != null;
					var rendered = attr_rendered != null && attr_rendered == "true";

					if (hasSrc) {
						if (attr_src.indexOf(options.domain) === 0) {
							parseHolder(options, instanceConfig, attr_src, image);
						} else if (hasDataSrc && attr_datasrc.indexOf(options.domain) === 0) {
							if (rendered) {
								parseHolder(options, instanceConfig, attr_datasrc, image);
							} else {
								imageExists({
									src: attr_src,
									options: options,
									instanceConfig: instanceConfig,
									dataSrc: attr_datasrc,
									image: image
								}, function (exists, config) {
									if (!exists) {
										parseHolder(config.options, config.instanceConfig, config.dataSrc, config.image);
									}
								})
							}
						}
					} else if (hasDataSrc) {
						if (attr_datasrc.indexOf(options.domain) === 0) {
							parseHolder(options, instanceConfig, attr_datasrc, image);
						}
					}

				})(images[i], options, instanceConfig);
			}
			return this;
		},
		invisibleErrorFn: function (fn) {
			return function (el) {
				if (el.hasAttribute('data-holder-invisible')) {
					throw 'Holder: invisible placeholder';
				}
			}
		}
	}

	function parseHolder(options, instanceConfig, src, el, FLAG) {
		var holder = parseFlags(src.substr(src.lastIndexOf(options.domain) + options.domain.length + 1).split('/'), options);

		if (holder) {
			if (holder.fluid) {
				render('fluid', el, holder, src, instanceConfig)
			} else {
				render('image', el, holder, src, instanceConfig);
			}
		}
	}

	function parseFlags(flags, options) {
		var ret = {
			theme: extend(app.settings.themes.gray, {})
		};
		var render = false;
		for (var fl = flags.length, j = 0; j < fl; j++) {
			var flag = flags[j];
			if (app.flags.dimensions.match(flag)) {
				render = true;
				ret.dimensions = app.flags.dimensions.output(flag);
			} else if (app.flags.fluid.match(flag)) {
				render = true;
				ret.dimensions = app.flags.fluid.output(flag);
				ret.fluid = true;
			} else if (app.flags.textmode.match(flag)) {
				ret.textmode = app.flags.textmode.output(flag)
			} else if (app.flags.colors.match(flag)) {
				var colors = app.flags.colors.output(flag)
				ret.theme = extend(colors, ret.theme);
			} else if (options.themes[flag]) {
				//If a theme is specified, it will override custom colors
				if (options.themes.hasOwnProperty(flag)) {
					ret.theme = extend(options.themes[flag], {});
				}
			} else if (app.flags.font.match(flag)) {
				ret.font = app.flags.font.output(flag);
			} else if (app.flags.auto.match(flag)) {
				ret.auto = true;
			} else if (app.flags.text.match(flag)) {
				ret.text = app.flags.text.output(flag);
			}
		}
		return render ? ret : false;
	}

	function textSize(width, height, fontSize) {
		height = parseInt(height, 10);
		width = parseInt(width, 10);
		var bigSide = Math.max(height, width)
		var smallSide = Math.min(height, width)
		var scale = 1 / 12;
		var newHeight = Math.min(smallSide * 0.75, 0.75 * bigSide * scale);
		return Math.round(Math.max(fontSize, newHeight))
	}

	var canvasRenderer = (function () {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		return function (props) {
			canvas.width = props.width;
			canvas.height = props.height;

			ctx.fillStyle = props.template.background;
			ctx.fillRect(0, 0, props.width, props.height);

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = props.font_weight + ' ' + (props.text_height * app.config.ratio) + 'px ' + props.font;
			ctx.fillStyle = props.template.foreground;
			ctx.fillText(props.text, (props.width / 2), (props.height / 2), props.width);

			return canvas.toDataURL('image/png');
		}
	})();

	var svgRenderer = (function () {
		//Prevent IE <9 from initializing SVG renderer
		if (!window.XMLSerializer) return;
		var serializer = new XMLSerializer();
		var svg_ns = 'http://www.w3.org/2000/svg'
		var svg = document.createElementNS(svg_ns, 'svg');
		//IE throws an exception if this is set and Chrome requires it to be set
		if (svg.webkitMatchesSelector) {
			svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
		}

		/* todo: needs to be generalized
		var xml = new DOMParser().parseFromString('<xml />', "application/xml")
		var css = xml.createProcessingInstruction('xml-stylesheet', 'href="http://netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet"');
		xml.insertBefore(css, xml.firstChild);
		xml.removeChild(xml.documentElement)
		var svg_css = serializer.serializeToString(xml);
		*/

		var svg_css = '';

		var bg_el = document.createElementNS(svg_ns, 'rect')
		var text_el = document.createElementNS(svg_ns, 'text')
		var textnode_el = document.createTextNode(null)
		text_el.setAttribute('text-anchor', 'middle')
		text_el.appendChild(textnode_el)
		svg.appendChild(bg_el)
		svg.appendChild(text_el)

		return function (props) {
			if (isNaN(props.width) || isNaN(props.height) || isNaN(props.text_height)) {
				throw 'Holder: incorrect properties passed to SVG constructor';
			}
			svg.setAttribute('width', props.width);
			svg.setAttribute('height', props.height);
			svg.setAttribute('viewBox', '0 0 ' + props.width + ' ' + props.height)
			svg.setAttribute('preserveAspectRatio', 'none')
			bg_el.setAttribute('width', props.width);
			bg_el.setAttribute('height', props.height);
			bg_el.setAttribute('fill', props.template.background);
			text_el.setAttribute('x', props.width / 2)
			text_el.setAttribute('y', props.height / 2)
			textnode_el.nodeValue = props.text
			text_el.setAttribute('style', cssProps({
				"fill": props.template.foreground,
				"font-weight": props.font_weight,
				"font-size": props.text_height + "px",
				"font-family": props.font,
				"dominant-baseline": "central"
			}))

			return svg_css + serializer.serializeToString(svg)
		}
	})();

	function renderToElement(mode, params, el, instanceConfig) {
		var image = null;

		var dimensions = params.dimensions;
		var template = params.template;
		var holder = params.holder;

		var width = dimensions.width;
		var height = dimensions.height;
		var text_height = textSize(width, height, template.size);

		var font = template.font ? template.font : 'Arial, Helvetica, sans-serif';
		var font_weight = template.fontweight ? template.fontweight : 'bold';
		var dimensions_caption = Math.floor(width) + 'x' + Math.floor(height);
		var text = template.text ? template.text : dimensions_caption;

		if (holder.textmode == 'literal') {
			var dimensions = holder.dimensions;
			text = dimensions.width + 'x' + dimensions.height;
		} else if (holder.textmode == 'exact' && holder.exact_dimensions) {
			var dimensions = holder.exact_dimensions;
			text = Math.floor(dimensions.width) + 'x' + Math.floor(dimensions.height);
		}

		var rendererParams = {
			text: text,
			width: width,
			height: height,
			text_height: text_height,
			font: font,
			font_weight: font_weight,
			template: template
		}

		if (instanceConfig.renderer == 'canvas') {
			image = canvasRenderer(rendererParams);
		} else if (instanceConfig.renderer == 'svg') {
			image = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgRenderer(rendererParams))));
		}

		if (image == null) {
			throw 'Holder: couldn\'t render placeholder';
		}

		if (mode == 'background') {
			el.style.backgroundImage = 'url(' + image + ')';
			el.style.backgroundSize = params.dimensions.width + 'px ' + params.dimensions.height + 'px';
		} else {
			el.setAttribute('src', image);
		}
		el.setAttribute('data-holder-rendered', true);
	}

	function render(mode, el, holder, src, instanceConfig) {
		var dimensions = holder.dimensions,
			theme = holder.theme,
			text = holder.text ? decodeURIComponent(holder.text) : holder.text;
		var dimensionsCaption = dimensions.width + 'x' + dimensions.height;
		theme = (text ? extend(theme, {
			text: text
		}) : theme);
		theme = (holder.font ? extend(theme, {
			font: holder.font
		}) : theme);
		el.setAttribute('data-src', src);
		holder.theme = theme;
		el.holderData = holder;
		el.configData = instanceConfig;

		if (mode == 'image') {
			el.setAttribute('alt', text ? text : theme.text ? theme.text + ' [' + dimensionsCaption + ']' : dimensionsCaption);
			if (instanceConfig.renderer == 'html' || !holder.auto) {
				el.style.width = dimensions.width + 'px';
				el.style.height = dimensions.height + 'px';
			}
			if (instanceConfig.renderer == 'html') {
				el.style.backgroundColor = theme.background;
			} else {
				renderToElement(mode, {
					dimensions: dimensions,
					template: theme,
					ratio: app.config.ratio,
					holder: holder
				}, el, instanceConfig);

				if (holder.textmode && holder.textmode == 'exact') {
					app.runtime.resizableImages.push(el);
					updateResizableElements(el);
				}
			}
		} else if (mode == 'background') {
			if (instanceConfig.renderer != 'html') {
				renderToElement(mode, {
						dimensions: dimensions,
						template: theme,
						ratio: app.config.ratio,
						holder: holder
					},
					el, instanceConfig);
			}
		} else if (mode == 'fluid') {
			el.setAttribute('alt', text ? text : theme.text ? theme.text + ' [' + dimensionsCaption + ']' : dimensionsCaption);
			if (dimensions.height.slice(-1) == '%') {
				el.style.height = dimensions.height
			} else if (holder.auto == null || !holder.auto) {
				el.style.height = dimensions.height + 'px'
			}
			if (dimensions.width.slice(-1) == '%') {
				el.style.width = dimensions.width
			} else if (holder.auto == null || !holder.auto) {
				el.style.width = dimensions.width + 'px'
			}
			if (el.style.display == 'inline' || el.style.display === '' || el.style.display == 'none') {
				el.style.display = 'block';
			}

			setInitialDimensions(el)

			if (instanceConfig.renderer == 'html') {
				el.style.backgroundColor = theme.background;
			} else {
				app.runtime.resizableImages.push(el);
				updateResizableElements(el);
			}
		}
	}

	function updateResizableElements(element) {
		var images;
		if (element == null || element.nodeType == null) {
			images = app.runtime.resizableImages;
		} else {
			images = [element]
		}
		for (var i in images) {
			if (!images.hasOwnProperty(i)) {
				continue;
			}
			var el = images[i];
			if (el.holderData) {
				var holder = el.holderData;
				var dimensions = dimensionCheck(el, Holder.invisibleErrorFn(updateResizableElements))
				if (dimensions) {
					if (holder.fluid) {
						if (holder.auto) {
							switch (holder.fluid_data.mode) {
							case 'width':
								dimensions.height = dimensions.width / holder.fluid_data.ratio;
								break;
							case 'height':
								dimensions.width = dimensions.height * holder.fluid_data.ratio;
								break;
							}
						}
					}

					var draw_params = {
						dimensions: dimensions,
						template: holder.theme,
						ratio: app.config.ratio,
						holder: holder
					};

					if (holder.textmode && holder.textmode == 'exact') {
						holder.exact_dimensions = dimensions;
						draw_params.dimensions = holder.dimensions;
					}

					renderToElement('image', draw_params, el, el.configData);
				}
			}
		}
	}

	function dimensionCheck(el, callback) {
		var dimensions = {
			height: el.clientHeight,
			width: el.clientWidth
		};
		if (!dimensions.height && !dimensions.width) {
			el.setAttribute('data-holder-invisible', true)
			callback.call(this, el)
		} else {
			el.removeAttribute('data-holder-invisible')
			return dimensions;
		}
	}

	function setInitialDimensions(el) {
		if (el.holderData) {
			var dimensions = dimensionCheck(el, Holder.invisibleErrorFn(setInitialDimensions))
			if (dimensions) {
				var holder = el.holderData;
				holder.initial_dimensions = dimensions;
				holder.fluid_data = {
					fluid_height: holder.dimensions.height.slice(-1) == '%',
					fluid_width: holder.dimensions.width.slice(-1) == '%',
					mode: null
				}
				if (holder.fluid_data.fluid_width && !holder.fluid_data.fluid_height) {
					holder.fluid_data.mode = 'width'
					holder.fluid_data.ratio = holder.initial_dimensions.width / parseFloat(holder.dimensions.height)
				} else if (!holder.fluid_data.fluid_width && holder.fluid_data.fluid_height) {
					holder.fluid_data.mode = 'height';
					holder.fluid_data.ratio = parseFloat(holder.dimensions.width) / holder.initial_dimensions.height
				}
			}
		}
	}

	//Configuration

	app.flags = {
		dimensions: {
			regex: /^(\d+)x(\d+)$/,
			output: function (val) {
				var exec = this.regex.exec(val);
				return {
					width: +exec[1],
					height: +exec[2]
				}
			}
		},
		fluid: {
			regex: /^([0-9%]+)x([0-9%]+)$/,
			output: function (val) {
				var exec = this.regex.exec(val);
				return {
					width: exec[1],
					height: exec[2]
				}
			}
		},
		colors: {
			regex: /#([0-9a-f]{3,})\:#([0-9a-f]{3,})/i,
			output: function (val) {
				var exec = this.regex.exec(val);
				return {
					foreground: '#' + exec[2],
					background: '#' + exec[1]
				}
			}
		},
		text: {
			regex: /text\:(.*)/,
			output: function (val) {
				return this.regex.exec(val)[1];
			}
		},
		font: {
			regex: /font\:(.*)/,
			output: function (val) {
				return this.regex.exec(val)[1];
			}
		},
		auto: {
			regex: /^auto$/
		},
		textmode: {
			regex: /textmode\:(.*)/,
			output: function (val) {
				return this.regex.exec(val)[1];
			}
		}
	}

	for (var flag in app.flags) {
		if (!app.flags.hasOwnProperty(flag)) continue;
		app.flags[flag].match = function (val) {
			return val.match(this.regex)
		}
	}

	app.settings = {
		domain: "holder.js",
		images: "img",
		bgnodes: ".holderjs",
		themes: {
			"gray": {
				background: "#eee",
				foreground: "#aaa",
				size: 12
			},
			"social": {
				background: "#3a5a97",
				foreground: "#fff",
				size: 12
			},
			"industrial": {
				background: "#434A52",
				foreground: "#C2F200",
				size: 12
			},
			"sky": {
				background: "#0D8FDB",
				foreground: "#fff",
				size: 12
			},
			"vine": {
				background: "#39DBAC",
				foreground: "#1E292C",
				size: 12
			},
			"lava": {
				background: "#F8591A",
				foreground: "#1C2846",
				size: 12
			}
		}
	};

	//Helpers

	function extend(a, b) {
		var c = {};
		for (var i in a) {
			if (a.hasOwnProperty(i)) {
				c[i] = a[i];
			}
		}
		for (var i in b) {
			if (b.hasOwnProperty(i)) {
				c[i] = b[i];
			}
		}
		return c
	}

	function cssProps(props) {
		var ret = [];
		for (var p in props) {
			if (props.hasOwnProperty(p)) {
				ret.push(p + ':' + props[p])
			}
		}
		return ret.join(';')
	}

	function debounce(fn) {
		if (!app.runtime.debounceTimer) fn.call(this);
		if (app.runtime.debounceTimer) clearTimeout(app.runtime.debounceTimer);
		app.runtime.debounceTimer = setTimeout(function () {
			app.runtime.debounceTimer = null;
			fn.call(this)
		}, app.config.debounce);
	}

	function resizeEvent() {
		debounce(function () {
			updateResizableElements(null);
		})
	}

	function imageExists(params, callback) {
		var image = new Image();
		image.onerror = function () {
			callback.call(this, false, params);
		}
		image.onload = function () {
			callback.call(this, true, params);
		}
		image.src = params.src;
	}

	//< v2.4 API compatibility

	Holder.add_theme = Holder.addTheme;
	Holder.add_image = Holder.addImage;
	Holder.invisible_error_fn = Holder.invisibleErrorFn;

	//Properties set once on setup

	app.config = {
		renderer: 'html',
		debounce: 100,
		ratio: 1
	};

	//Properties modified during runtime

	app.runtime = {
		preempted: false,
		resizableImages: [],
		debounceTimer: null
	};

	//Pre-flight

	(function () {
		var devicePixelRatio = 1,
			backingStoreRatio = 1;

		var canvas = document.createElement('canvas');
		var ctx = null;

		if (canvas.getContext) {
			if (canvas.toDataURL('image/png').indexOf('data:image/png') != -1) {
				app.config.renderer = 'canvas';
				ctx = canvas.getContext('2d');
			}
		}

		if (app.config.renderer == 'canvas') {
			devicePixelRatio = window.devicePixelRatio || 1;
			backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
		}

		app.config.ratio = devicePixelRatio / backingStoreRatio;

		if (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
			app.config.renderer = 'svg';
		}
	})();

	//Exposing to environment and setting up listeners

	register(Holder, 'Holder', global);

	if (global.onDomReady) {
		global.onDomReady(function () {
			if (!app.runtime.preempted) {
				Holder.run({});
			}
			if (global.addEventListener) {
				global.addEventListener('resize', resizeEvent, false);
				global.addEventListener('orientationchange', resizeEvent, false);
			} else {
				global.attachEvent('onresize', resizeEvent);
			}

			if (typeof global.Turbolinks == 'object') {
				global.document.addEventListener('page:change', function () {
					Holder.run({});
				})
			}
		})
	}

})(function (fn, name, global) {
	var isAMD = (typeof define === 'function' && define.amd);
	var isNode = (typeof exports === 'object');
	var isWeb = !isNode;

	if (isAMD) {
		define(fn);
	} else {
		global[name] = fn;
	}
}, this);
