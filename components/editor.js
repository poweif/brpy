var MainPanel = React.createClass({
    getInitialState: function() {
        return {
            name: '',
            srcs: {},
            srcFiles: [],
            defaultFileInd: -1,
            dialogOpen: false,
            canvasId: "mainPanelCanvas"
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
    onGeneralCancel: function() {
        skulptgl.closeDialog();
        this.setState({dialogOpen: false});
    },
    onProjectNameOK: function(text) {
        var that = this;
        var success = function() {
            skulptgl.closeDialog();
            that.setState({name: text, dialogOpen: false});
        };

        var failure = function() {
            skulptgl.openDialog(null, "Failed to change project name",
                that.onGeneralCancel, null);
            this.setState({dialogOpen: false});
        };

        skulptgl.closeDialog();
        skulptgl.openDialog(null, "Working...", null, null);

        var proj = {};
        proj[skulptgl.project.NAME] = text;
        skulptgl.writeProject(proj, success, failure);
    },
    onProjectNameClick: function() {
        this.setState({dialogOpen: true});
        skulptgl.openDialog(
            this.state.name, "New project name?", this.onProjectNameOK,
            this.onGeneralCancel);
    },
    onFileNameOK: function(oldFile, newFile) {
        if (newFile === oldFile)
            return;

        skulptgl.closeDialog();
        skulptgl.openDialog(null, "Working...", null, null);

        oldFileExt = oldFile + ".py"
        newFileExt = newFile + ".py"

        var that = this;

        var ofiles = skulptgl.util.deepCopy(this.state.srcFiles);
        var nfiles = ofiles.map(
            function(file) {
                return file==oldFileExt ? newFileExt : file;
            }
        );

        var successFile = function() {
            skulptgl.closeDialog();
            that.setState({srcFiles: nfiles, dialogOpen: false});
        };

        var failureFile = function() {
            skulptgl.openDialog(null, "Failed to change file name",
                that.onGeneralCancel, null);
            that.setState({dialogOpen: false});

            // roll back project change
            console.log("hope we never get here :(");
            var oproj = {};
            oproj[skulptgl.project.SRC] = ofiles;
            skulptgl.writeProject(oproj);
        };

        var successProj = function() {
            skulptgl.renameSrcFile(oldFileExt, newFileExt, successFile,
                failureFile);
        };

        var failureProj = function() {
            skulptgl.openDialog(null, "Failed to change file name",
                that.onGeneralCancel, null);
            that.setState({dialogOpen: false});
        };

        var proj = {};
        proj[skulptgl.project.SRC] = nfiles;
        skulptgl.writeProject(proj, successProj, failureProj);
    },
    onFileNameClick: function(oldFile) {
        var that = this;
        var fnameOK = function(newFile) {
            that.onFileNameOK(oldFile, newFile);
        };
        this.setState({dialogOpen: true});
        skulptgl.openDialog(
            oldFile, "New file name?", fnameOK,
            this.onGeneralCancel);
    },
    onLoadProject: function(text) {
        var project = JSON.parse(text);
        this.setState({
            name: project[skulptgl.project.NAME],
            srcFiles: project[skulptgl.project.SRC],
            defaultFileInd: project[skulptgl.project.DEFAULT_FILE]
        });
    },
    onLoadSource: function(file, text) {
        var srcs = this.state.srcs;
        srcs[file] = text;
        this.setState({srcs: srcs});
    },
    runProg: function() {
        // If files are missing, do not run program.
        for (var i = 0; i < this.state.srcFiles.length; i++) {
            var file = this.state.srcFiles[i];
            if (!this.state.srcs[file])
                return;
        }

        var prog = '';
        var that = this;
        this.state.srcFiles.map(
            function(file) {
                prog += that.state.srcs[file] + '\n';
            }
        );

        var output = function(s) { console.log(s); };
        var builtinRead = function(x) {
            if (Sk.builtinFiles === undefined ||
                Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        };

        Sk.canvas = this.state.canvasId;
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
    onRun: function() {
        this.onSave();
        this.runProg();
    },
    onSave: function() {

    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        if (prevState.srcFiles != this.state.srcFiles) {
            console.log("update!!!");
            this.state.srcFiles.map(
                function (file) {
                    skulptgl.readSrcFile(
                        file,
                        function(text) {that.onLoadSource(file, text);}
                    );
                }
            );
        }
    },
    componentDidMount: function() {
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
        var that = this;
        var fileButtons = this.state.srcFiles.map(
            function(fileExt, order) {
                var file = fileExt.substring(0, fileExt.indexOf('.'));
                var click = function() {
                    that.onFileNameClick(file);
                };
                var buttonClassName = "button";
                if (order == that.state.defaultFileInd)
                    buttonClassName += "-selected";
                return (
                    <div key={order} className={buttonClassName}
                        onClick={click} >
                        <span>{fileExt}</span>
                        <span className="file-order">{order}</span>
                    </div>
                );
            }
        );
        var srcFile = this.state.srcFiles[this.state.defaultFileInd];
        var src = null;
        if (srcFile)
            src = this.state.srcs[srcFile];

        var optButtons = [];
        optButtons.push((function() { return (
            <img src="/img/add186.png"  className="options-button" />
        );})());
        
        optButtons.push((function() { return (
            <img src="/img/close47.png"  className="options-button" />
        );})());

        return (
            <div className="main-panel">
                <div className="project-name-holder">
                    <span className="project-name"
                        onClick={this.onProjectNameClick}>
                        {this.state.name}
                    </span>
                </div>
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="canvas-wrapper">
                        <canvas ref="context" id={this.state.canvasId}></canvas>
                    </div>
                    <div>
                        <div className="button-row">
                            <span>{fileButtons}</span>
                            <span>{optButtons}</span>
                        </div>
                        <SourceEditor src={src} onRun={this.onRun}
                            onSave={this.onSave}
                            dialogOpen={this.state.dialogOpen} />
                    </div>
                </div>
            </div>
        );
    }
});

var SourceEditor = React.createClass({
    cdm: null,
    onScrollTo: function() {
        if (!this.cdm)
            return;
        var cursorPos = (this.cdm.cursorCoords().top +
                         this.cdm.cursorCoords().bottom) / 2;
        var winHeight = window.innerHeight;
        window.scrollTo(0, cursorPos - (winHeight / 2));
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevProps.src != this.props.src && this.props.src) {
            var code = this.props.src;
            this.refs.textarea.getDOMNode().value = code;
            var textarea = this.refs.textarea.getDOMNode();
            this.cdm = CodeMirror.fromTextArea(textarea, {
                value: code,
                lineNumbers: true,
                mode: "python",
                keyMap: "emacs",
                autoCloseBrackets: true,
                matchBrackets: true,
                showCursorWhenSelecting: true,
                theme: "monokai"
            });
        }
    },
    componentDidMount: function() {
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };

        shortcut.remove('Ctrl+B');
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
        if (this.props.onRun)
            shortcut.add('Ctrl+B', this.props.onRun, keyMapParams);
        if (this.props.onSave)
            shortcut.add('Ctrl+S', this.props.onSave, keyMapParams);
        // Technically this should be in codemirror's emacs keymap, but putting
        // this here for now.
        shortcut.add('Ctrl+L', this.onScrollTo, keyMapParams);
    },
    render: function() {
        return (
            <div className="editor">
                <div className=
                    {this.props.dialogOpen ? "codearea-hidden" : "codearea"} >
                    <textarea ref="textarea" cols="79" rows="30"></textarea>
                </div>
            </div>
        );
    }
});
