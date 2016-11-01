# Holder

![](http://imsky.github.io/holder/images/header.png)

Holder renders image placeholders on the client side using SVG.

Used by [Bootstrap](http://getbootstrap.com), thousands of [open source projects](https://github.com/search?q=holder.js+in%3Apath&type=Code&ref=searchresults), and [many](https://search.nerdydata.com/search/#!/searchTerm=holder.js/searchPage=1/sort=pop) [other](http://libscore.com/#Holder) sites.

[![npm](https://img.shields.io/npm/v/holderjs.svg)](https://www.npmjs.com/package/holderjs)
[![Travis Build Status](https://img.shields.io/travis/imsky/holder.svg)](https://travis-ci.org/imsky/holder)
[![Package Quality](http://npm.packagequality.com/shield/holderjs.svg)](http://packagequality.com/#?package=holderjs)

## Installing

* [npm](http://npmjs.com/): `npm install holderjs`
* [Bower](http://bower.io/): `bower install holderjs`
* [RawGit](http://rawgit.com): <https://cdn.rawgit.com/imsky/holder/master/holder.js>
* [cdnjs](http://cdnjs.com/): <http://cdnjs.com/libraries/holder>
* [jsDelivr](http://www.jsdelivr.com): <http://www.jsdelivr.com/#!holder>
* [Rails Assets](https://rails-assets.org): `gem 'rails-assets-holderjs'`
* [Meteor](http://atmospherejs.com/): `meteor add imsky:holder`
* [Composer](https://packagist.org/): `php composer.phar update imsky/holder`
* [NuGet](http://www.nuget.org/): `Install-Package Holder.js`

## Usage

Include ``holder.js`` in your HTML:

```html
<script src="holder.js"></script>
```

Holder will then process all images with a specific ``src`` attribute, like this one:

```html
<img src="holder.js/300x200">
```

The above tag will render as a placeholder 300 pixels wide and 200 pixels tall.

To avoid console 404 errors, you can use ``data-src`` instead of ``src``.

### Programmatic usage

To programmatically insert a placeholder use the `run()` API:

```js
var myImage = document.getElementById('myImage');

Holder.run({
  images: myImage
});
```

## Placeholder options

Placeholder options are set through URL properties, e.g. `holder.js/300x200?x=y&a=b`. Multiple options are separated by the `&` character.

* `theme`: The theme to use for the placeholder. Example: `holder.js/300x200?theme=sky`
* `random`: Use random theme. Example: `holder.js/300x200?random=yes`
* `bg`: Background color. Example: `holder.js/300x200?bg=2a2025`
* `fg`: Foreground (text) color. Example: `holder.js/300x200?fg=ffffff`
* `text`: Custom text. Example: `holder.js/300x200?text=Hello`
* `size`: Custom text size. Defaults to `pt` units. Example: `holder.js/300x200?size=50`
* `font`: Custom text font. Example: `holder.js/300x200?font=Helvetica`
* `align`: Custom text alignment (left, right). Example: `holder.js/300x200?align=left`
* `outline`: Draw outline and diagonals for placeholder. Example: `holder.js/300x200?outline=yes`
* `lineWrap`: Maximum line length to image width ratio. Example: `holder.js/300x200?lineWrap=0.5`

### Themes

![](http://imsky.github.io/holder/images/holder_sky.png)![](http://imsky.github.io/holder/images/holder_vine.png)![](http://imsky.github.io/holder/images/holder_lava.png)

Holder includes support for themes, to help placeholders blend in with your layout.

There are 6 default themes: ``sky``, ``vine``, ``lava``, ``gray``, ``industrial``, and ``social``.

#### Customizing themes

Themes have 5 properties: ``fg``, ``bg``, ``size``, ``font`` and ``fontweight``. The ``size`` property specifies the minimum font size for the theme. The ``fontweight`` default value is ``bold``. You can create a sample theme like this:

```js
Holder.addTheme("dark", {
  bg: "#000",
  fg: "#aaa",
  size: 11,
  font: "Monaco",
  fontweight: "normal"
});
```

If you have a group of placeholders where you'd like to use particular text, you can do so by adding a ``text`` property to the theme:

```js
Holder.addTheme("thumbnail", { bg: "#fff", text: "Thumbnail" });
```

#### Using custom themes

There are two ways to use custom themes with Holder:

* Include theme at runtime to render placeholders already using the theme name
* Include theme at any point and re-render placeholders that are using the theme name

The first approach is the easiest. After you include ``holder.js``, add a ``script`` tag that adds the theme you want:

```html
<script src="holder.js"></script>
<script>
Holder.addTheme("bright", {
  bg: "white", fg: "gray", size: 12
});
</script>
```

The second approach requires that you call ``run`` after you add the theme, like this:

```js
Holder.addTheme("bright", {bg: "white", fg: "gray", size: 12}).run();
```

#### Using custom themes and domain on specific images

You can use Holder in different areas on different images with custom themes:

```html
<img data-src="example.com/100x100?theme=simple" id="new">
```

```js
Holder.run({
  domain: "example.com",
  themes: {
    "simple": {
      bg: "#fff",
      fg: "#000",
      size: 12
    }
  },
  images: "#new"
});
```

#### Inserting an image with custom theme

You can add a placeholder programmatically by chaining Holder calls:

```js
Holder.addTheme("new", {
  fg: "#ccc",
  bg: "#000",
  size: 10
}).addImage("holder.js/200x100?theme=new", "body").run();
```

The first argument in ``addImage`` is the ``src`` attribute, and the second is a CSS selector of the parent element.

### Text

Holder automatically adds line breaks to text that goes outside of the image boundaries. If the text is so long it goes out of both horizontal and vertical boundaries, the text is moved to the top. If you prefer to control the line breaks, you can add `\n` to the `text` property:

```html
<img data-src="holder.js/300x200?text=Add \n line breaks \n anywhere.">
``````

If you would like to disable line wrapping, set the `nowrap` option to `true`:

```html
<img data-src="holder.js/300x200?text=Add \n line breaks \n anywhere.&amp;nowrap=true">
```

Placeholders using a custom font are rendered using canvas by default, due to SVG's constraints on cross-domain resource linking. If you're using only locally available fonts, you can disable this behavior by setting `noFontFallback` to `true` in `Holder.run` options. However, if you need to render a SVG placeholder using an externally loaded font, you have to use the `object` tag instead of the `img` tag and add a `holderjs` class to the appropriate `link` tags. Here's an example:

```html
<head>
<link href="http://.../font-awesome.css" rel="stylesheet" class="holderjs">
</head>
<body>
<object data-src="holder.js/300x200?font=FontAwesome"></object>
```

**Important:** When testing locally, font URLs must have a `http` or `https` protocol defined.

**Important:** Fonts served from locations other than public registries (i.e. Google Fonts, Typekit, etc.) require the correct CORS headers to be set. See [How to use CDN with Webfonts](https://www.maxcdn.com/one/tutorial/how-to-use-cdn-with-webfonts/) for more details.

`<object>` placeholders work like `<img>` placeholders, with the added benefit of their DOM being able to be inspected and modified. As with `<img>` placeholders, the `data-src` attribute is more reliable than the `data` attribute.

### Fluid placeholders

**Important:** Percentages are specified with the `p` character, not with the `%` character.

Specifying a dimension in percentages creates a fluid placeholder that responds to media queries.

```html
<img data-src="holder.js/100px75?theme=social">
```

By default, the fluid placeholder will show its current size in pixels. To display the original dimensions, i.e. 100%x75, set the ``textmode`` flag to ``literal`` like so: `holder.js/100px75?textmode=literal`.

### Automatically sized placeholders

If you'd like to avoid Holder enforcing an image size, use the ``auto`` flag like so:

```html
<img data-src="holder.js/200x200?auto=yes">
```

The above will render a placeholder without any embedded CSS for height or width.

To show the current size of an automatically sized placeholder, set the ``textmode`` flag to ``exact`` like so: `holder.js/200x200?auto=yes&textmode=exact`.

### Preventing updates on window resize

Both fluid placeholders and automatically sized placeholders in exact mode are updated when the window is resized. To set whether or not a particular image is updated on window resize, you can use the `setResizeUpdate` method like so:

```js
var img = $('#placeholder').get(0);
Holder.setResizeUpdate(img, false);
```

The above will pause any render updates on the specified image (which must be a DOM object).

To enable updates again, run the following:

```js
Holder.setResizeUpdate(img, true);
```

This will enable updates and immediately render the placeholder.

### Background placeholders

Holder can render placeholders as background images for elements with the `holderjs` class, like this:

```css
#sample {background:url(?holder.js/200x200?theme=social) no-repeat}
```

```html
<div id="sample" class="holderjs"></div>
```

The Holder URL in CSS should have a `?` in front. Like in image placeholders, you can specify the Holder URL in a `data-background-src` attribute:

```html
<div class="holderjs" data-background-src="?holder.js/300x200"></div>
```

**Important:** Make sure to define a height and/or width for elements with background placeholders. Fluid background placeholders are not yet supported.

## Runtime settings

Holder provides several options at runtime that affect the process of image generation. These are passed in through `Holder.run` calls.

* `domain`: The domain to use for image generation. Default value: `holder.js`.
* `dataAttr`: The HTML attribute used to define a fallback to the native `src` attribute. Default value: `data-src`.
* `renderer`: The renderer to use. Options available: `svg`, `canvas`. Default value: `svg`.
* `images`: The CSS selector used for finding `img` tags. Default value: `img`.
* `objects`: The CSS selector used for finding `object` placeholders. Default value: `object`.
* `bgnodes`: The CSS selector used for finding elements that have background palceholders. Default value: `body .holderjs`.
* `stylenodes`: The CSS selector used for finding stylesheets to import into SVG placeholders. Default value: `head link.holderjs`.
* `noFontFallback`: Do not fall back to canvas if using custom fonts.
* `noBackgroundSize`: Do not set `background-size` for background placeholders.

### Using custom settings on load

You can prevent Holder from running its default configuration by executing ``Holder.run`` with your custom settings right after including ``holder.js``. However, you'll have to execute ``Holder.run`` again to render any placeholders that use the default configuration.

## Using with [lazyload.js](https://github.com/tuupola/jquery_lazyload)


Holder is compatible with ``lazyload.js`` and works with both fluid and fixed-width images. For best results, run `.lazyload({skip_invisible:false})`.

## Using with Angular.js

You can use Holder in Angular projects with [ng-holder](https://github.com/joshvillbrandt/ng-holder) or with [angular-2-holderjs](https://github.com/aogriffiths/angular-2-holderjs) for Angular 2 projects.

## Using with Meteor

Because Meteor includes scripts at the top of the document by default, the DOM may not be fully available when Holder is called. For this reason, place Holder-related code in a "DOM ready" event listener.

## Browser support

* Chrome
* Firefox 3+
* Safari 4+
* Internet Explorer 9+ (with partial support for 6-8)
* Opera 12+
* Android (with fallback)

## Source

* GitHub: <https://github.com/imsky/holder>
* GitLab: <https://gitlab.com/imsky/holder>

## License

Holder is provided under the [MIT License](http://opensource.org/licenses/MIT).

## Credits

Holder is a project by [Ivan Malopinsky](http://imsky.co).
