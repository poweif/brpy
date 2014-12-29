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
    handleScroll: function(ev) {
        this.refs.context.getDOMNode().style.marginTop =
            window.pageYOffset + 'px';
    },
    handleResize: function(ev) {
        var width = Math.min(
            this.refs.contextWrapper.getDOMNode().offsetWidth - 30,
            window.innerHeight - 150
        );

        this.refs.context.getDOMNode().style.width = width + 'px';
        this.refs.context.getDOMNode().style.height = width + 'px';
        this.refs.context.getDOMNode().width = width;
        this.refs.context.getDOMNode().height = width;
    },
    componentDidMount: function() {
        console.log('mount');
        var that = this;
        skulptgl.readProject(
            function(text) {
                var project = JSON.parse(text);
                that.setState({
                    name: project.name,
                    srcFiles: project.src,
                    defaultFileInd: project.default_file
                });
            }
        );
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    },
    componentWillUnmount: function() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
    },
    render: function() {
        var canvasId = "mainPanelCanvas";
        return (
            <div className="main-panel">
                <img className="setting-button" src="img/settings49.png"></img>
                <div className="project-name">{this.state.name}</div>
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="canvas-wrapper">
                        <canvas ref="context" id={canvasId}></canvas>
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
    cdm: null,
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
            var code = text;
            this.refs.content.getDOMNode().value = code;
            var codearea = this.refs.content.getDOMNode();
            this.cdm = CodeMirror.fromTextArea(codearea, {
                value: text,
                lineNumbers: true,
                mode: "python",
                keyMap: "emacs",
                autoCloseBrackets: true,
                matchBrackets: true,
                showCursorWhenSelecting: true,
                theme: "monokai"
            });
        }
        var curSrcs = this.state.srcs;
        curSrcs[file] = text;
        this.setState({srcs: curSrcs, run: true});
    },
    saveTextContent: function() {
        var oldInd = this.state.selectedFileInd;
        if (oldInd >= 0) {
            var oldSrcs = this.state.srcs;
            var oldFile = this.props.srcFiles[oldInd];
            var source = this.refs.content.getDOMNode().value;
            if (this.cdm) {
                source = this.cdm.getValue();
            }

            oldSrcs[oldFile] = source;
            this.setState({srcs: oldSrcs});

            skulptgl.writeSrcFile(
                oldFile,
                source,
                function(text) {
                    console.log("finished writing: " + text);
                }
            );
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
    onRunPress: function(e) {
        this.saveTextContent();
        this.runProg();
    },
    onSavePress: function(e) {
        this.saveTextContent();
    },
    loadFiles: function() {
        var that = this;
        this.props.srcFiles.map(
            function(file) {
                skulptgl.readSrcFile(
                    file,
                    function(text) { that.loadSource(file, text); }
                );
            }
        );
        shortcut.remove('Ctrl+B');
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
        shortcut.add(
            'Ctrl+B',
            this.onRunPress,
            {
                type: 'keydown',
                propagate: false,
                target: document
            }
        )
        shortcut.add(
            'Ctrl+S',
            this.onSavePress,
            {
                type: 'keydown',
                propagate: false,
                target: document
            }
        )
        shortcut.add(
            'Ctrl+L',
            function() {},
            {
                type: 'keydown',
                propagate: false,
                target: document
            }
        )
    },
    componentDidUpdate: function(prevProps, prevStates) {
        if (prevProps.srcFiles != this.props.srcFiles)
            this.loadFiles();

        if (prevProps.defaultFileInd != this.props.defaultFileInd)
            this.setState({selectedFileInd: this.props.defaultFileInd});

        if (this.state.run) {
            this.runProg();
            this.setState({run: false});
        }
    },
    componentDidMount: function() {
        this.loadFiles();
        if (this.props.defaultFileInd)
            this.setState({selectedFileInd: this.props.defaultFileInd});
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
                    <div key={order} className="file-button"
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
                <div className="codearea">
                  <textarea ref="content" cols="79" rows="30"></textarea>
                </div>
            </div>
        );
    }
});
