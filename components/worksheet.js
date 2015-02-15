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

//var OutputPane

var WorksheetBlock = React.createClass({
    render: function() {
        return (
            <div className="worksheet-block">
                <div className="separator">
                    <div className="separator-line"></div>
                    <Button text="test" />
                    <Button icon="drop25" />
                </div>
                <div className="block-content">
                    <span className="content"></span>
                    <div className="divide-line"></div>
                    <span className="content"></span>
                </div>
                <div className="separator">
                    <div className="separator-line"></div>
                    <Button text="test" />
                    <Button icon="drop27" />
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
            defaultFileInd: -1,
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
    handleScroll: function() {
        this.refs.contextWrapper.getDOMNode().style.marginTop =
            window.pageYOffset + 'px';
    },
    handleResize: function() {
        var width = Math.min(
            this.refs.contextWrapper.getDOMNode().offsetWidth - 30,
            window.innerHeight - 150
        );

        var panelDoms = this.state.panelDoms;
        if (panelDoms) {
            panelDoms.forEach(function(dom) {
                dom.style.width = width + 'px';
                dom.style.height = width + 'px';
                dom.width = width;
                dom.height = width;
            });
        }
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

        if (this.state.defaultFileInd != ind) {
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
                defaultFileInd: nfiles.length - 1
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
                defaultFileInd: 0
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
                defaultFileInd: target
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
            defaultFileInd: project[SKULPTGL_PROJECT_DEFAULT_FILE]
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

            var wrapper = this.refs.contextWrapper.getDOMNode();
            while(wrapper.hasChildNodes()) {
                wrapper.removeChild(wrapper.firstChild);
            }
            Sk.progdomIds().forEach(function(elem) {
                wrapper.appendChild(elem.dom);
            });
            var ndoms = Sk.progdomIds().map(function(elem) {
                return elem.dom;
            });
            this.setState({panelDoms: ndoms});
        } catch(e) {
            console.log("python[ERROR]> " + e.toString());
        }
    },
    onRun: function(code) {
        if (this.state.defaultFileInd < 0 ||
            this.state.defaultFileInd >= this.state.srcFiles.length) {
            return;
        }
        this.memSave(this.state.srcFiles[this.state.defaultFileInd], code);
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
            var oldFile = this.state.srcFiles[this.state.defaultFileInd];
            this.memSave(oldFile, this.refs.editor.getContent());
            this.setState({
                defaultFileInd: ind
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
        this.handleResize();
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
                var click = function() {
                    that.onFileNameClick(skulptgl.util.getFileName(fileExt));
                };
                var selected = order == that.state.defaultFileInd;
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
        fileButtons.push(function() {
            return <Button icon="add186" click={that.onFileAddClick} />;
        }());

        var srcFile = this.state.srcFiles[this.state.defaultFileInd];
        var src = null;
        if (srcFile)
            src = this.state.srcs[srcFile];

        var save = function(code) {
            that.onSave(that.state.srcFiles[that.state.defaultFileInd], code);
        };

        return (
           <div className="main-panel">
                <HeaderBar projectName={this.state.name}
                    onProjectRenameClick={this.onProjectRenameClick} />
                <StdoutConsole ref="stdoutConsole" />
                <WorksheetBlock />
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="context-wrapper">
                    </div>
                    <div>
                        <div className="button-row">
                            <span className="file-row">{fileButtons}</span>
                        </div>
                        <SourceEditor ref="editor" src={src} onRun={this.onRun}
                            onSave={save}
                            isDialogOpen={this.state.isDialogOpen} />
                    </div>
                </div>
            </div>
        );
    }
});
