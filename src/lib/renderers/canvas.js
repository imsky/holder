var DOM = require('../dom');
var utils = require('../utils');

module.exports = (function() {
    var canvas = DOM.newEl('canvas');
    var ctx = null;

    return function(sceneGraph) {
        if (ctx == null) {
            ctx = canvas.getContext('2d');
        }

        var dpr = utils.canvasRatio();
        var root = sceneGraph.root;
        canvas.width = dpr * root.properties.width;
        canvas.height = dpr * root.properties.height ;
        ctx.textBaseline = 'middle';

        var bg = root.children.holderBg;
        var bgWidth = dpr * bg.width;
        var bgHeight = dpr * bg.height;
        //todo: parametrize outline width (e.g. in scene object)
        var outlineWidth = 2;
        var outlineOffsetWidth = outlineWidth / 2;

        ctx.fillStyle = bg.properties.fill;
        ctx.fillRect(0, 0, bgWidth, bgHeight);

        if (bg.properties.outline) {
            //todo: abstract this into a method
            ctx.strokeStyle = bg.properties.outline.fill;
            ctx.lineWidth = bg.properties.outline.width;
            ctx.moveTo(outlineOffsetWidth, outlineOffsetWidth);
            // TL, TR, BR, BL
            ctx.lineTo(bgWidth - outlineOffsetWidth, outlineOffsetWidth);
            ctx.lineTo(bgWidth - outlineOffsetWidth, bgHeight - outlineOffsetWidth);
            ctx.lineTo(outlineOffsetWidth, bgHeight - outlineOffsetWidth);
            ctx.lineTo(outlineOffsetWidth, outlineOffsetWidth);
            // Diagonals
            ctx.moveTo(0, outlineOffsetWidth);
            ctx.lineTo(bgWidth, bgHeight - outlineOffsetWidth);
            ctx.moveTo(0, bgHeight - outlineOffsetWidth);
            ctx.lineTo(bgWidth, outlineOffsetWidth);
            ctx.stroke();
        }

        var textGroup = root.children.holderTextGroup;
        ctx.font = textGroup.properties.font.weight + ' ' + (dpr * textGroup.properties.font.size) + textGroup.properties.font.units + ' ' + textGroup.properties.font.family + ', monospace';
        ctx.fillStyle = textGroup.properties.fill;

        for (var lineKey in textGroup.children) {
            var line = textGroup.children[lineKey];
            for (var wordKey in line.children) {
                var word = line.children[wordKey];
                var x = dpr * (textGroup.x + line.x + word.x);
                var y = dpr * (textGroup.y + line.y + word.y + (textGroup.properties.leading / 2));

                ctx.fillText(word.properties.text, x, y);
            }
        }

        return canvas.toDataURL('image/png');
    };
})();