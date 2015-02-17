var StdoutConsole =  React.createClass({
    getInitialState: function() {
        return {
            hidden: true,
        };
    },
    toggleConsole: function() {
        this.setState({hidden: !this.state.hidden});
    },
    write: function(s) {
        var textarea = this.refs.tarea.getDOMNode();
        textarea.value += (s + '\n');
        textarea.scrollTop = textarea.scrollHeight;
    },
    render: function() {
        var stdoutCn = "stdout-console";
        var verticalButtonCn = "vertical-button";
        var buttonImg = "/img/keyboard54.png";

        if (this.state.hidden) {
            stdoutCn += " stdout-console-hide";
            buttonImg = "/img/sort52.png";
            verticalButtonCn += " vertical-button-hide";
        }
        return (
            <div className={stdoutCn}>
                <textarea ref="tarea" readOnly></textarea>
                <img src={buttonImg}
                     className={verticalButtonCn}
                     onClick={this.toggleConsole} />
            </div>
        )
    }
});

var HeaderBar = React.createClass({
    render: function(){
        var func = function() {
            console.log("clicking!");
        };
        var buttons = [
            {text: "Projects", hr: true},
            {text: "Options", hr: true},
            {text: "new...", click: func, icon: "add186"},
            {text: "rename", click: func, icon: "rotate11",
             click: this.props.onProjectRenameClick},
            {text: "delete", click: func, icon: "close47"},
        ];

        return (
            <ButtonMenu large text={this.props.projectName}
               items={buttons}/>
        );
    }
});

var ContentPane = React.createClass({
    mountContentDoms: function() {
        if (!this.props.contentDoms)
            return;

        var wrapper = this.refs.main.getDOMNode();
        while(wrapper.hasChildNodes()) {
            wrapper.removeChild(wrapper.firstChild);
        }
        this.props.contentDoms.forEach(function(elem) {
            wrapper.appendChild(elem);
        });
    },
    componentDidUpdate: function() {
        this.mountContentDoms();
    },
    componentDidMount: function() {
        this.mountContentDoms();
    },
    maxHeight: function() {
        return skulptgl.util.fullElementHeight(this.getDOMNode());
    },
    render: function() {
        return (
            <div ref="main" className="content-pane"></div>
        );
    }
});

var EditorFileRow = React.createClass({
    render: function() {
        var that = this;
        var fileButtons = this.props.srcFiles.map(
            function(fileExt, order) {
                var click = function() {
                    that.props.onFileNameClick(
                        skulptgl.util.getFileName(fileExt));
                };
                var selected = order == that.props.currentFileInd;
                if (!selected) {
                    return <Button click={click} selected={selected}
                               key={order} text={fileExt} />;
                }
                var buttons = [
                    {text: "move left", icon: "go10"},
                    {text: "move right", icon: "right244"},
                    {text: "rename", icon: "rotate11"},
                    {text: "delete", icon: "close47"}
                ];
                return <ButtonMenu text={fileExt} items={buttons}
                           selected="true" />
            }
        );
        return (
            <div className="editor-file-row">
                <div className="files">{fileButtons}</div>
                <Button icon="add186" />
            </div>
        );
    }
});

var EditorPane = React.createClass({
    maxHeight: function() {
        var totalHeight = 0;
        if (this.refs.fileRow) {
            totalHeight +=
                skulptgl.util.fullElementHeight(this.refs.fileRow.getDOMNode());
        }

        if (this.refs.editor)
            totalHeight += this.refs.editor.maxHeight();
        return totalHeight;
    },
    render: function() {
        var src = null;
        if (this.props.currentFileInd >= 0) {
            var srcFileName = this.props.srcFiles[this.props.currentFileInd];
            src = this.props.srcTexts[srcFileName];
        }

        var editorPaneCn = "editor-pane";
        if (!this.props.highlightable)
            editorPaneCn += " unselectable";

        return (
            <div className={editorPaneCn}>
                <EditorFileRow ref="fileRow"
                    onFileNameClick={this.props.onFileNameClick}
                    currentFileInd={this.props.currentFileInd}
                    srcFiles={this.props.srcFiles} />
                <div className="editor-wrapper">
                    <SourceEditor ref="editor" src={src}
                        height={this.props.height}
                        onRun={this.props.onRun} onSave={this.props.onSave}
                        isDialogOpen={this.props.isDialogOpen} />
                </div>
            </div>
        );
    }
});

var WorksheetBlock = React.createClass({
    verticalDrag: null,
    separatorDrag: null,
    getInitialState: function() {
        return {
            editorHighlightable: true,
            collapsed: false
        };
    },
    verticalDivideMouseDown: function(e) {
        if (this.verticalDrag) {
            window.removeEventListener("mousemove", this.verticalDrag);
            this.verticalDrag = null;
        }

        var srcX = e.clientX;
        var srcWidth = this.refs.contentPane.getDOMNode()
            .getBoundingClientRect().width;
        this.verticalDrag = function(f) {
            var finalWidth = srcWidth - (srcX - f.clientX);
            this.refs.contentPane.getDOMNode().style.flex = "none";
            this.refs.contentPane.getDOMNode().style.width = finalWidth + "px";
        }.bind(this);
        window.addEventListener("mousemove", this.verticalDrag);
        this.setState({editorHighlightable: false});
    },
    separatorMouseDown: function(upper, e) {
        if (this.separatorDrag) {
            window.removeEventListener("mousemove", this.separatorDrag);
            this.separatorDrag= null;
        }

        var srcY = e.clientY;
        var srcHeight = this.height();
        this.separatorDrag = function(f) {
            this.setHeight(srcHeight - (srcY - f.clientY) * (upper ? -1 : 1));
        }.bind(this);
        window.addEventListener("mousemove", this.separatorDrag);
        this.setState({editorHighlightable: false});
    },
    mouseUp: function() {
        if (this.verticalDrag) {
            window.removeEventListener("mousemove", this.verticalDrag);
            this.verticalDrag = null;
        }

        if (this.separatorDrag) {
            window.removeEventListener("mousemove", this.separatorDrag);
            this.separatorDrag = null;
        }
        this.setState({editorHighlightable: true});
    },
    componentDidMount: function() {
        this.setHeight(this.defaultHeight());
        window.addEventListener("mouseup", this.mouseUp);
    },
    defaultHeight: function() {
        return window.innerHeight - 100;
    },
    height: function() {
        return this.getDOMNode().getBoundingClientRect().height;
    },
    maxHeight: function() {
        var height = 0;
        if (this.refs.editorPane)
            height = Math.max(height, this.refs.editorPane.maxHeight());
        if (this.refs.contentPane)
            height = Math.max(height, this.refs.contentPane.maxHeight());
        if (this.refs.separator) {
            height += 2 *
                skulptgl.util.fullElementHeight(
                    this.refs.separator.getDOMNode());
        }
        return height + 30;
    },
    setHeight: function(h, trans, transEnd) {
        if (trans) {
            this.getDOMNode().style.transition = "height .3s";
            if (transEnd)
                this.getDOMNode().addEventListener(
                    "transitionend", transEnd, false);
        } else {
            this.getDOMNode().style.transition = null;
        }
        this.getDOMNode().style.height = h + "px";
    },
    collapseTransitionEnd: function() {
        this.getDOMNode().removeEventListener(
            "transitionend", this.collapseTransitionEnd);
        this.setState({collapsed: true});
    },
    blockExpand: function() {
        if (this.height() < this.defaultHeight()) {
            var transEnd = null;
            if (this.state.collapsed) {
                var that = this;
                transEnd = function() {
                    if (that.refs.editorPane)
                        that.refs.editorPane.forceUpdate();
                    that.getDOMNode().removeEventListener(
                        "transitionend", transEnd);
                };
                this.setState({collapsed: false});
                this.setHeight(this.defaultHeight(), true, transEnd);
            }
            this.setHeight(this.defaultHeight(), true, transEnd);
            return
        }
        var maxHeight = this.maxHeight();
        if (this.height() < maxHeight)
            this.setHeight(maxHeight, true);
    },
    blockCollapse: function() {
        if (this.height() > this.defaultHeight()) {
            this.setHeight(this.defaultHeight(), true);
            return;
        }
        this.setHeight(0, true, this.collapseTransitionEnd);
    },
    render: function() {
        if (this.state.collapsed) {
            return (
                <div className="worksheet-block">
                    <div className="separator">
                        <div className="collapsed-line-wrapper"
                            onClick={this.blockExpand}>
                            <div className="collapsed-line"></div>
                        </div>
                        <Button text="test" />
                        <Button icon="show7" click={this.blockExpand} />
                    </div>
                </div>
            );
        }

        var sepUpper =
            function(e) { this.separatorMouseDown(true, e); }.bind(this);
        var sepLower =
            function(e) { this.separatorMouseDown(false, e); }.bind(this);
        return (
            <div className="worksheet-block">
                <div ref="separator" className="separator">
                    <div className="separator-line-wrapper" onMouseDown={sepUpper}>
                        <div className="separator-line"></div>
                    </div>
                    <Button text="test" />
                    <Button icon="show4" click={this.blockCollapse} />
                    <Button icon="show7" click={this.blockExpand} />
                </div>
                <div className="block-content">
                    <ContentPane ref="contentPane"
                        contentDoms={this.props.contentDoms} />
                    <div className="divide-line-wrapper"
                        onMouseDown={this.verticalDivideMouseDown}>
                        <div className="divide-line"></div>
                    </div>
                    <EditorPane ref="editorPane" onRun={this.props.onRun}
                        highlightable={this.state.editorHighlightable}
                        onSave={this.props.onSave} height="500"
                        onFileNameClick={this.props.onFileNameClick}
                        isDialogOpen={this.props.isDialogOpen}
                        srcTexts={this.props.srcTexts}
                        srcFiles={this.props.srcFiles}
                        currentFileInd={this.props.currentFileInd} />
                </div>
                <div className="separator">
                    <div className="separator-line-wrapper" onMouseDown={sepLower}>
                        <div className="separator-line"></div>
                    </div>
                    <Button text="test" />
                    <Button icon="show4" click={this.blockCollapse} />
                    <Button icon="show7" click={this.blockExpand} />
                </div>
            </div>
        );
    }
});

var MainPanel = React.createClass({
    mixins: [DialogMixins(function(v) {
        this.setState({isDialogOpen: v})
    })],
    getInitialState: function() {
        return {
            name: '',
            srcs: {},
            srcFiles: [],
            currentFileInd: -1,
            isDialogOpen: false,
            panelDoms: null
        };
    },
    onProjectRenameOk: function(text) {
        var that = this;
        var success = function() {
            that.closeDialog();
            that.setState({name: text});
        };
        var failure = function() {
            that.openPromptDialog("Failed to change project name");
        };
        this.openWorkingDialog();

        skulptgl.writeProject({SKULPTGL_PROJECT_NAME: text}, success, failure);
    },
    onProjectRenameClick: function() {
        this.openTextDialog(
            this.state.name, "New project name?", this.onProjectNameOK);
    },
    onFileNameOK: function(oldFile, newFile) {
        if (newFile === oldFile)
            return;

        this.openWorkingDialog();

        var oldFileExt = oldFile + ".py"
        var newFileExt = newFile + ".py"

        var that = this;

        var ofiles = skulptgl.util.deepCopy(this.state.srcFiles);
        var nfiles = ofiles.map(
            function(file) {
                return file==oldFileExt ? newFileExt : file;
            }
        );

        var successFile = function() {
            that.closeDialog();
            that.setState({srcFiles: nfiles});
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to change file name");

            // roll back project change
            console.log("hope we never get here :(");
            skulptgl.writeProject({SKULPTGL_PROJECT_SRC: ofiles});
        };

        var successProj = function() {
            skulptgl.renameSrcFile(oldFileExt, newFileExt, successFile,
                                   failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file name");
        };

        var proj = {};
        proj[SKULPTGL_PROJECT_SRC] = nfiles;
        skulptgl.writeProject({SKULPTGL_PROJECT_SRC: nfiles}, successProj,
                              failureProj);
    },
    onFileNameClick: function(oldFile) {
        var ind = skulptgl.util.indexOf(this.state.srcFiles, oldFile + ".py");

        if (this.state.currentFileInd != ind) {
            this.changeCurrentFile(ind);
            return;
        }
    },
    onFileAddOK: function(fname) {
        var fnameExt = fname + ".py";
        var fileSrc = "# " + fnameExt;

        if (skulptgl.util.indexOf(this.state.srcFiles, fnameExt) >= 0) {
            this.openPromptDialog("File already exist");
            return;
        }

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);
        nfiles.push(fnameExt);

        var successFile = function() {
            that.closeDialog();
            that.state.srcs[fnameExt] = fileSrc;
            that.setState({
                srcFiles: nfiles,
                currentFileInd: nfiles.length - 1
            });
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to add file");

            // roll back project change
            console.log("hope we never get here :(");
            skulptgl.writeProject({SKULPTGL_PROJECT_SRC: ofiles});
        };

        var successProj = function() {
            skulptgl.writeSrcFile(
                fnameExt, fileSrc, successFile, failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to add file");
        };

        skulptgl.writeProject({SKULPTGL_PROJECT_SRC: nfiles}, successProj,
                              failureProj);
    },
    onFileAddClick: function() {
        this.openTextDialog("new", "New file?", this.onFileAddOK);
    },
    onFileDeleteOK: function(fname) {
        var fnameExt = fname + ".py";

        if (this.state.srcFiles.length < 2) {
            that.openPromptDialog(
                "Cannot delete " + fnameExt +
                    " since we need at least one source file.");
            return;
        }

        var ind = skulptgl.util.indexOf(this.state.srcFiles, fnameExt);
        if (ind < 0)
            return;

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);
        nfiles.splice(ind, 1);

        var successFile = function() {
            that.closeDialog();
            that.setState({
                srcFiles: nfiles,
                currentFileInd: 0
            });
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to delete file");

            // roll back project change
            console.log("hope we never get here :(");
            skulptgl.writeProject({SKULPTGL_PROJECT_SRC: ofiles});
        };

        var successProj = function() {
            skulptgl.deleteSrcFile(fnameExt, successFile, failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file name");
        };
        skulptgl.writeProject({SKULPTGL_PROJECT_SRC: nfiles}, successProj,
                              failureProj);
    },
    onFileDeleteClick: function(fname) {
        var del = function() { this.onFileDeleteOK(fname); }.bind(this);
        this.openBinaryDialog(
            "Are you sure you'd like to delete " + (fname + ".py") + "?", del);
    },
    onFileIndClick: function(origin, target) {
        if (target < 0 || target >= this.state.srcFiles.length)
            return;

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);

        var tmp = nfiles[origin];
        nfiles[origin] = nfiles[target];
        nfiles[target] = tmp;

        var successProj = function() {
            that.closeDialog();
            that.setState({
                srcFiles: nfiles,
                currentFileInd: target
            });
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file order");
        };
        skulptgl.writeProject({SKULPTGL_PROJECT_SRC: nfiles}, successProj,
                              failureProj);
    },
    onLoadProject: function(text) {
        var project = JSON.parse(text);
        this.setState({
            name: project[SKULPTGL_PROJECT_NAME],
            srcFiles: project[SKULPTGL_PROJECT_SRC],
            currentFileInd: project[SKULPTGL_PROJECT_DEFAULT_FILE]
        });
    },
    onLoadSource: function(file, text) {
        console.log("source loaded " + file);
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

        var that = this;
        var progs = this.state.srcFiles.map(function(file) {
            return {name: file, body: that.state.srcs[file]};
        });

        var output = function(s) {
            if (s.trim().length > 0)
                that.refs.stdoutConsole.write(s);
        };
        var builtinRead = function(x) {
            if (Sk.builtinFiles === undefined ||
                Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        };

        Sk.configure({
            "output": output,
            "debugout": output,
            "read": builtinRead
        });
        try {
            Sk.importMainWithMultipleFiles(false, progs);
            var ndoms = Sk.progdomIds().map(function(elem) {
                return elem.dom;
            });
            this.setState({panelDoms: ndoms});
        } catch (e) {
//            console.log(e.stack);
            console.log("python[ERROR]> " + e.toString());
        }
    },
    onRun: function(code) {
        if (this.state.currentFileInd < 0 ||
            this.state.currentFileInd >= this.state.srcFiles.length) {
            return;
        }
        this.memSave(this.state.srcFiles[this.state.currentFileInd], code);
        this.runProg();
    },
    memSave: function(fname, code) {
        if (!fname)
            return;
        this.state.srcs[fname] = code;
    },
    onSave: function(fname, code, onSuccess, onFail) {
        if (!fname)
            return;

        this.memSave(fname, code);

        var success = function() {
            console.log("Successfully wrote " + fname);
            if (onSuccess)
                onSuccess();
        };
        var fail = function() {
            console.log("Failed to write " + fname);
            if (onFail)
                onFail();
        };
        skulptgl.writeSrcFile(fname, code, success, fail);
    },
    changeCurrentFile: function(ind) {
        if (ind < 0 || ind >= this.state.srcFiles.length)
            return;

        if (this.refs.editor) {
            var oldFile = this.state.srcFiles[this.state.currentFileInd];
            this.memSave(oldFile, this.refs.editor.getContent());
            this.setState({
                currentFileInd: ind
            });
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        if (prevState.srcFiles != this.state.srcFiles) {
            var toRead = [];
            for (var i = 0; i < this.state.srcFiles.length; i++) {
                var file = this.state.srcFiles[i];
                if (!this.state.srcs[file])
                    toRead.push(file);
            }
            var f = function(aRead) {
                if (toRead.length == 0) {
                    // Try running after the sources have been loaded.
                    that.runProg();
                    return;
                }
                var read = aRead[0];
                aRead.splice(0, 1);
                var g = function(text) {
                    if (!text) {
                        console.log("reading " + read + " failed");
                        return;
                    }
                    that.onLoadSource(read, text);
                    f(aRead);
                };
                skulptgl.readSrcFile(read, g, g);
            }
            f(toRead);
        }
    },
    componentDidMount: function() {
        skulptgl.readProject(this.onLoadProject);
    },
    render: function() {
        var that = this;
        var save = function(code) {
            that.onSave(that.state.srcFiles[that.state.currentFileInd], code);
        };
        var run = this.onRun;

        return (
           <div className="main-panel">
                <HeaderBar projectName={this.state.name}
                    onProjectRenameClick={this.onProjectRenameClick} />
                <StdoutConsole ref="stdoutConsole" />
                <WorksheetBlock srcFiles={this.state.srcFiles}
                    onFileNameClick={this.onFileNameClick}
                    srcTexts={this.state.srcs} onSave={save} onRun={run}
                    currentFileInd={this.state.currentFileInd}
                    contentDoms={this.state.panelDoms}
                    isDialogOpen={this.state.isDialogOpen} />
            </div>
        );
    }
});
