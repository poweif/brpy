var MainPanel = React.createClass({
    getInitialState: function() {
        return {
            name: '',
            srcFiles: [],
            srcFileIds: [],
            defaultFileInd: -1,
            dialogOpen: false
        };
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
    onProjectNameClick: function() {
        var proj = {
            srcFileIds: skulptgl.util.deepCopy(this.state.srcFileIds),
            name: this.state.name
        };

        this.setState({dialogOpen: true});
        skulptgl.openProjectDialog(
            proj, this.onProjectDialogOK, this.onProjectDialogCancel);
    },
    onProjectDialogCancel: function() {
        this.setState({dialogOpen: false});
        skulptgl.closeProjectDialog();
    },
    processProjectChanges: function(oldproj, proj) {
        var that = this;

        var oldIds = {};
        var newIds = {};
        oldproj.srcFileIds.map(function(idName) {
            oldIds[idName[0]] = idName[1];
        });
        proj.srcFileIds.map(function(idName) {
            newIds[idName[0]] = idName[1];
        });

        var toDelete = [];
        // delete
        for (var i = 0; i < oldproj.srcFileIds.length; i++) {
            var fid = oldproj.srcFileIds[i][0];
            if (newIds[fid] === undefined)
                toDelete.push(fid);
        }
        if (toDelete.length > 0) {
            var modproj = skulptgl.util.deepCopy(oldproj);
            var delFunc = function(dels) {
                var len = dels.length;
                if (len == 0)
                    func();
                delFunc(dels.slice(1, len), func);
            }

        }

        // create

        // rename

        // project metadata
        if (oldproj.name != proj.name) {
            var newProj = {};
            newProj[skulptgl.project.NAME] = proj.name;

            var load = function() {
                console.log('successfully wrote project');
                this.setState({name: proj.name});
                oldproj.name = proj.name;
                that.processProjectChanges(
            };
            skulptgl.writeProject(newProj, load, failed);
        }
    },
    onProjectDialogOK: function(oldproj) {
        var that = this;
        return function (proj) {
            that.processProjectChanges(oldproj, proj);
            that.setState({dialogOpen: false});
            skulptgl.closeProjectDialog();
        }
    },
    onLoadProject: function(text) {
        var project = JSON.parse(text);
        var fileIds = project.src.map(
            function(fname) {return [skulptgl.util.makeId(), fname];});
        this.setState({
            name: project[skulptgl.project.NAME],
            srcFiles: project[skulptgl.project.SRC],
            srcFileIds: fileIds,
            defaultFileInd: project[skulptgl.project.DEFAULT_FILE],
        });
    },
    componentDidMount: function() {
        var that = this;
        skulptgl.readProject(this.onLoadProject);
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
                <div className="project-name-holder">
                <span className="project-name" onClick={this.onProjectNameClick}>
                        {this.state.name}
                    </span>
                </div>
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="canvas-wrapper">
                        <canvas ref="context" id={canvasId}></canvas>
                    </div>
                    <SourceEditor canvasId={canvasId}
                         srcFiles={this.state.srcFiles}
                         defaultFileInd={this.state.defaultFileInd}
                         dialogOpen={this.state.dialogOpen} />
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
            this.refs.textarea.getDOMNode().value = code;
            var textarea = this.refs.textarea.getDOMNode();
            this.cdm = CodeMirror.fromTextArea(textarea, {
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
            var oldSource = oldSrcs[oldFile];
            var source = oldSource;
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
            if (this.cdm)
                this.cdm.setValue(this.state.srcs[file]);
            this.setState({selectedFileInd: ind});
        }
    },
    onRun: function() {
        this.saveTextContent();
        this.runProg();
    },
    onSave: function() {
        this.saveTextContent();
    },
    onScrollTo: function() {
        if (!this.cdm)
            return;
        var cursorPos = (this.cdm.cursorCoords().top +
                         this.cdm.cursorCoords().bottom) / 2;
        var winHeight = window.innerHeight;
        window.scrollTo(0, cursorPos - (winHeight / 2));
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

        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };

        shortcut.remove('Ctrl+B');
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
        shortcut.add('Ctrl+B', this.onRun, keyMapParams);
        shortcut.add('Ctrl+S', this.onSave, keyMapParams);
        // Technically this should be in codemirror's emacs keymap, but putting
        // this here for now.
        shortcut.add('Ctrl+L', this.onScrollTo, keyMapParams);
    },
    componentDidUpdate: function(prevProps, prevStates) {
        if (prevProps.srcFiles != this.props.srcFiles)
            this.loadFiles();

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
                var buttonClassName = "button";
                if (order == that.state.selectedFileInd)
                    buttonClassName += "-selected";
                return (
                    <div key={order} className={buttonClassName}
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
                <div className=
                    {this.props.dialogOpen ? "codearea-hidden" : "codearea"} >
                    <textarea ref="textarea" cols="79" rows="30"></textarea>
                </div>
            </div>
        );
    }
});
