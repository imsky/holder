var augment = require('./lib/augment');

var SceneGraph = function(sceneProperties) {
    var nodeCount = 1;

    //todo: move merge to helpers section
    function merge(parent, child) {
        for (var prop in child) {
            parent[prop] = child[prop];
        }
        return parent;
    }

    var SceneNode = augment.defclass({
        constructor: function(name) {
            nodeCount++;
            this.parent = null;
            this.children = {};
            this.id = nodeCount;
            this.name = 'n' + nodeCount;
            if (name != null) {
                this.name = name;
            }
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.width = 0;
            this.height = 0;
        },
        resize: function(width, height) {
            if (width != null) {
                this.width = width;
            }
            if (height != null) {
                this.height = height;
            }
        },
        moveTo: function(x, y, z) {
            this.x = x != null ? x : this.x;
            this.y = y != null ? y : this.y;
            this.z = z != null ? z : this.z;
        },
        add: function(child) {
            var name = child.name;
            if (this.children[name] == null) {
                this.children[name] = child;
                child.parent = this;
            } else {
                throw 'SceneGraph: child with that name already exists: ' + name;
            }
        }
    });

    var RootNode = augment(SceneNode, function(uber) {
        this.constructor = function() {
            uber.constructor.call(this, 'root');
            this.properties = sceneProperties;
        };
    });

    var Shape = augment(SceneNode, function(uber) {
        function constructor(name, props) {
            uber.constructor.call(this, name);
            this.properties = {
                fill: '#000'
            };
            if (props != null) {
                merge(this.properties, props);
            } else if (name != null && typeof name !== 'string') {
                throw 'SceneGraph: invalid node name';
            }
        }

        this.Group = augment.extend(this, {
            constructor: constructor,
            type: 'group'
        });

        this.Rect = augment.extend(this, {
            constructor: constructor,
            type: 'rect'
        });

        this.Text = augment.extend(this, {
            constructor: function(text) {
                constructor.call(this);
                this.properties.text = text;
            },
            type: 'text'
        });
    });

    var root = new RootNode();

    this.Shape = Shape;
    this.root = root;

    return this;
};

module.exports = SceneGraph;
