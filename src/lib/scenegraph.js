var SceneGraph = function(sceneProperties) {
    var nodeCount = 1;

    //todo: move merge to helpers section
    function merge(parent, child) {
        for (var prop in child) {
            parent[prop] = child[prop];
        }
        return parent;
    }

    var SceneNode = function(name) {
        nodeCount++;
        this.parent = null;
        this.children = {};
        this.id = nodeCount;
        this.name = 'n' + nodeCount;
        if (typeof name !== 'undefined') {
            this.name = name;
        }
        this.x = this.y = this.z = 0;
        this.width = this.height = 0;
    };

    SceneNode.prototype.resize = function(width, height) {
        if (width != null) {
            this.width = width;
        }
        if (height != null) {
            this.height = height;
        }
    };

    SceneNode.prototype.moveTo = function(x, y, z) {
        this.x = x != null ? x : this.x;
        this.y = y != null ? y : this.y;
        this.z = z != null ? z : this.z;
    };

    SceneNode.prototype.add = function(child) {
        var name = child.name;
        if (typeof this.children[name] === 'undefined') {
            this.children[name] = child;
            child.parent = this;
        } else {
            throw 'SceneGraph: child already exists: ' + name;
        }
    };

    var RootNode = function() {
        SceneNode.call(this, 'root');
        this.properties = sceneProperties;
    };

    RootNode.prototype = new SceneNode();

    var Shape = function(name, props) {
        SceneNode.call(this, name);
        this.properties = {
            'fill': '#000000'
        };
        if (typeof props !== 'undefined') {
            merge(this.properties, props);
        } else if (typeof name !== 'undefined' && typeof name !== 'string') {
            throw 'SceneGraph: invalid node name';
        }
    };

    Shape.prototype = new SceneNode();

    var Group = function() {
        Shape.apply(this, arguments);
        this.type = 'group';
    };

    Group.prototype = new Shape();

    var Rect = function() {
        Shape.apply(this, arguments);
        this.type = 'rect';
    };

    Rect.prototype = new Shape();

    var Text = function(text) {
        Shape.call(this);
        this.type = 'text';
        this.properties.text = text;
    };

    Text.prototype = new Shape();

    var root = new RootNode();

    this.Shape = {
        'Rect': Rect,
        'Text': Text,
        'Group': Group
    };

    this.root = root;
    return this;
};

module.exports = SceneGraph;
