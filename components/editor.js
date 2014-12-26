var MainPanel = React.createClass({
    render: function() {
        var canvasId = "mainPanelCanvas";
        return (
             <div className="main-panel">
                <div className="canvas-wrapper">
                    <canvas id={canvasId}>
                    </canvas>
                </div>
                <SourceEditor canvasId={canvasId} />
            </div>
        );
    }
});

var SourceEditor = React.createClass({
    getInitialState: function() {
        return {
            srcs: {},
            contentText: ''
        };
    },
    loadContent: function (url) {
        if (this.props.loaded)
            return;

        var that = this;
        if (url) {
            var contentReq = new XMLHttpRequest();
            contentReq.onload = function() {
                var prog = this.responseText;
                that.refs.content.getDOMNode().value = prog;

                var output = function(s) { console.log(s); };
                var builtinRead = function(x) {
                    if (Sk.builtinFiles === undefined ||
                        Sk.builtinFiles["files"][x] === undefined) {
                        throw "File not found: '" + x + "'";
                    }
                    return Sk.builtinFiles["files"][x];
                };

                Sk.canvas = that.props.canvasId;
                Sk.configure({
                    "output": output,
                    "debugout": output,
                    "read": builtinRead
                });
                try {
                    eval(Sk.importMainWithBody("<stdin>", false, prog));
                } catch(e) {
                    console.log(e);
                    console.log(e.stack);
                }
            };

            contentReq.open('GET', url, true);
            contentReq.send();
        }
    },
    componentDidMount: function() {
        this.loadContent('/simple/test.py');
    },
    render: function() {
        return (
            <textarea ref="content" cols="79" rows="30"></textarea>
        );
    }
});
