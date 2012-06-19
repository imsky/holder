Holder
======

Holder is a client-side image placeholder library that uses ``<canvas>`` and the data URI scheme to render placeholders entirely in browser.

How to use it
-------------

Include ``holder.js`` in your HTML. Holder will process all images with a specific ``src`` attribute, like this:

```html
<img src="holder.js/200x300">
```

The above will render as a placeholder 200 pixels wide and 300 pixels tall.

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

The first approach is the easiest. After you include ``holder.js``, add a ``script`` tag that adds the theme you want.

The second approach requires that you call ``run`` after you add the theme, like this:

```js
Holder.add_theme("bright", {background:"white", foreground:"gray", size:12}).run()
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
            }},
    images: "#new"
    })
```

Using custom colors on specific images
--------------------------------------

You don't have to create a new theme just to use custom colors. Custom colors can be specified in the ``background:foreground`` format using hex notation, like this:

```html
<img data-src="holder.js/100x200/#000:#fff">
```

The above will render a placeholder with a black background and white text.

Using partially custom settings
-------------------------------

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
* Internet Explorer 9+

License
-------

Holder is provided under the BSD license. Commercial use requires attribution.

Credits
-------

Holder is a project by [Ivan Malopinsky](http://imsky.co).