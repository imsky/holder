Holder
======

Holder uses the `canvas` element and the data URI scheme to render image placeholders entirely in browser.

How to use it
-------------

Include ``holder.js`` in your HTML:

```html
<script src="holder.js"></script>
```

Holder will then process all images with a specific ``src`` attribute, like this one:

```html
<img src="holder.js/200x300">
```

The above tag will render as a placeholder 200 pixels wide and 300 pixels tall.

```html
<img src="holder.js/200">
<img src="holder.js/200/social">
```

If you need square images, you can just put one size

To avoid console 404 errors, you can use ``data-src`` instead of ``src``.

Holder also includes support for themes, to help placeholders blend in with your layout. There are 3 default themes: ``gray``, ``industrial``, and ``social``. You can use them like this:

```html
<img src="holder.js/200x300/industrial">
```

Customizing themes
------------------

Themes have 3 properties: ``foreground``, ``background``, and ``size``. The ``size`` property specifies the minimum font size for the theme. You can create a sample theme like this:

```js
Holder.add_theme("dark", {background:"#000", foreground:"#aaa", size:11})
```

Using custom themes
-------------------

There are two ways to use custom themes with Holder:

* Include theme at runtime to render placeholders already using the theme name
* Include theme at any point and re-render placeholders that are using the theme name

The first approach is the easiest. After you include ``holder.js``, add a ``script`` tag that adds the theme you want:

```html
<script src="holder.js"></script>
<script> Holder.add_theme("bright", { background: "white", foreground: "gray", size: 12 })</script>
```

The second approach requires that you call ``run`` after you add the theme, like this:

```js
Holder.add_theme("bright", { background: "white", foreground: "gray", size: 12}).run()
```

Using custom themes and domain on specific images
-------------------------------------------------

You can use Holder in different areas on different images with custom themes:

```html
<img data-src="example.com/100x100/simple" id="new">
```

```js
Holder.run({
    domain: "example.com",
    themes: {
        "simple":{
            background:"#fff",
            foreground:"#000",
            size:12
            }
    },
    images: "#new"
    })
```

Using custom colors on specific images
--------------------------------------

Custom colors on a specific image can be specified in the ``background:foreground`` format using hex notation, like this:

```html
<img data-src="holder.js/100x200/#000:#fff">
```

The above will render a placeholder with a black background and white text.

Custom text
-----------

You can specify custom text using the ``text:`` operator:

```html
<img data-src="holder.js/200x200/text:hello world">
```

If you have a group of placeholders where you'd like to use particular text, you can do so by adding a ``text`` property to the theme:

```js
Holder.add_theme("thumbnail", { background: "#fff", text: "Thumbnail" })
```

Background placeholders
-----------------------

Holder can render placeholders as background images for elements with the `holderjs` class, like this:

```css
#sample {background:url(?holder.js/200x200/social) no-repeat}
```

```html
<div id="sample" class="holderjs"></div>
```

The Holder URL in CSS should have a `?` in front. You can change the default class by specifying a selector as the `elements` property when calling `Holder.run`.

Customizing only the settings you need
--------------------------------------

Holder extends its default settings with the settings you provide, so you only have to include those settings you want changed. For example, you can run Holder on a specific domain like this:

```js
Holder.run({domain:"example.com"})
```

Using custom settings on load
-----------------------------

You can prevent Holder from running its default configuration by executing ``Holder.run`` with your custom settings right after including ``holder.js``. However, you'll have to execute ``Holder.run`` again to render any placeholders that use the default configuration.

Inserting an image with optional custom theme
---------------------------------------------

You can add a placeholder programmatically by chaining Holder calls:

```js
Holder.add_theme("new",{foreground:"#ccc", background:"#000", size:10}).add_image("holder.js/200x100/new", "body").run()
```

The first argument in ``add_image`` is the ``src`` attribute, and the second is a CSS selector of the parent element.

Browser support
---------------

* Chrome 1+
* Firefox 3+
* Safari 4+
* Internet Explorer 9+, with fallback for IE6-8
* Android 1+

License
-------

Holder is provided under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0). Commercial use requires attribution.

Credits
-------

Holder is a project by [Ivan Malopinsky](http://imsky.co).