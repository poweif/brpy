var MainPanel = React.createClass({
    getInitialState: function() {
        return {
            name: '',
            srcFiles: [],
            srcRoot: '',
            defaultFileInd: -1
        };
    },
    loadProject: function(url, text) {
        if (!text)
            return;
        var proj = JSON.parse(text);
        var root = url.substring(0, url.lastIndexOf('/') + 1);
        this.setState({
            name: proj.name,
            srcRoot: root,
            srcFiles: proj.src,
            defaultFileInd: proj.default_file
        });
    },
    loadProjectReq: function (projectUrl) {
        var that = this;
        skulptgl.xhr(
            projectUrl,
            function() { that.loadProject(projectUrl, this.responseText); }
        );
    },
    componentDidMount: function() {
        this.loadProjectReq('/simple/simple.proj');
    },
    render: function() {
        var canvasId = "mainPanelCanvas";
        return (
            <div className="main-panel">
                <div className="project-name">{this.state.name}</div>
                <div className="bottom-panel">
                    <div className="canvas-wrapper">
                        <canvas id={canvasId}></canvas>
                    </div>
                    <SourceEditor canvasId={canvasId}
                         srcRoot={this.state.srcRoot}
                         srcFiles={this.state.srcFiles}
                         defaultFileInd={this.state.defaultFileInd}  />
                </div>
            </div>
        );
    }
});

var SourceEditor = React.createClass({
    getInitialState: function() {
        return {
            srcs: {},
            selectedFileInd: -1,
            run: false
        };
    },
    runProg: function() {
        // If files are missing, do not run program.
        for (var i = 0; i < this.props.srcFiles.length; i++) {
            var file = this.props.srcFiles[i];
            if (!this.state.srcs[file])
                return;
        }

        var prog = '';
        for (var i = 0; i < this.props.srcFiles.length; i++) {
            var file = this.props.srcFiles[i];
            prog += this.state.srcs[file] + '\n';
        }

        var output = function(s) { console.log(s); };
        var builtinRead = function(x) {
            if (Sk.builtinFiles === undefined ||
                Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        };

        Sk.canvas = this.props.canvasId;
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
    },
    loadSource: function(file, text) {
        var fileInd = skulptgl.util.indexOf(this.props.srcFiles, file);
        if (this.state.selectedFileInd == fileInd && fileInd >= 0) {
            this.refs.content.getDOMNode().value = text;
        }
        var curSrcs = this.state.srcs;
        curSrcs[file] = text;
        this.setState({
            srcs: curSrcs,
            run: true
        });
    },
    saveTextContent: function() {
        var oldInd = this.state.selectedFileInd;
        if (oldInd >= 0) {
            var oldSrcs = this.state.srcs;
            var oldFile = this.props.srcFiles[oldInd];
            oldSrcs[oldFile] = this.refs.content.getDOMNode().value;
            this.setState({srcs: oldSrcs});
        }
    },
    onClickFileButton : function(ind) {
        var oldInd = this.state.selectedFileInd;
        if (oldInd != ind && ind >= 0) {
            this.saveTextContent();
            var file = this.props.srcFiles[ind];
            this.refs.content.getDOMNode().value = this.state.srcs[file];
            this.setState({selectedFileInd: ind});
        }
    },
    onKeyPress: function(e) {
        // Ctrl + b
        if (e.which == 2) {
            this.saveTextContent();
            this.runProg();
        }
    },
    loadFiles: function() {
        var that = this;
        this.props.srcFiles.map(
            function (file) {
                var url = that.props.srcRoot + file;
                skulptgl.xhr(
                    url,
                    function() { that.loadSource(file, this.responseText); }
                );
            }
        );

        document.removeEventListener("keypress", this.onKeyPress, false);
        document.addEventListener("keypress", this.onKeyPress, false);
    },
    componentDidUpdate: function(prevProps, prevStates) {
        if (prevProps.srcFiles != this.props.srcFiles) {
            this.loadFiles();
        }

        if (prevProps.defaultFileInd != this.props.defaultFileInd) {
            this.setState({selectedFileInd: this.props.defaultFileInd});
        }

        if (this.state.run) {
            this.runProg();
            this.setState({run: false});
        }
    },
    componentDidMount: function() {
        this.loadFiles();
        if (this.props.defaultFileInd) {
            this.setState({selectedFileInd: this.props.defaultFileInd});
        }
        var that = this;
    },
    componentWillUnmount: function() {
        document.removeEventListener("keypress", this.onKeyPress, false);
    },
    render: function() {
        var that = this;
        var buttons = this.props.srcFiles.map(
            function(file, order) {
                var click = (function() {
                    return function () {
                        that.onClickFileButton(order);
                    };
                })();
                return (
                    <div key={order} className="file-buttons"
                        onClick={click} >
                        <span>{file}</span>
                        <span className="file-order">{order}</span>
                    </div>
                );
            }
        );
        return (
            <div className="editor">
                <div className="button-row">
                    {buttons}
                </div>
                <textarea ref="content" cols="79" rows="30"></textarea>
            </div>
        );
    }
});
