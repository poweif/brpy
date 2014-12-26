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
            srcs: {}
        };
    },
    loadContent: function (url) {
        if (this.props.loaded)
            return;

        var that = this;
        if (url) {
            var contentReq = new XMLHttpRequest();
            contentReq.onload = function() {
                that.refs.content.getDOMNode().value = this.responseText;
            };
            contentReq.open('GET', url, true);
            contentReq.send();
        }
    },
    componentDidMount: function() {
        this.loadContent('/simple/main.py');
    },
    render: function() {
        return (
            <textarea ref="content" cols="79" rows="30"></textarea>
        );
    }
});
