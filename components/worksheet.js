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
        if (!this.props.projects)
            return null;

        var func = function() {
            console.log("clicking!");
        };
        var that = this;
        var current = this.props.projects[this.props.currentProject];
        var buttons = [{text: "Projects", hr: true}];
        buttons = buttons.concat(
            this.props.projects.map(function(proj) {
                if (proj == current)
                    return null;
                var projectClick = function() {
                    return that.props.onProjectClick(proj);
                };
                return {text: proj, click: projectClick};
            })
        );
        var rename = function() { return that.props.onProjectRename(current); };
        var del = function() { return that.props.onProjectDelete(current); };
        buttons = buttons.concat([
            {text: "new...", click: this.props.onProjectNew,
             icon: "add186"},
            {text: "Options", hr: true},
            {text: "rename", click: rename, icon: "rotate11"},
            {text: "delete", click: del, icon: "close47"},
        ]);

        return (
            <ButtonMenu large text={current} items={buttons}/>
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
        if (this.props.resize) {
            this.props.resize();
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevProps.contentDoms !== this.props.contentDoms)
            this.mountContentDoms();
    },
    componentDidMount: function() {
        this.mountContentDoms();
    },
    maxHeight: function() {
        return SKG.util.fullElementHeight(this.getDOMNode());
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
                var selected = order == that.props.currentFileInd;
                if (!selected) {
                    var click = function() {
                        that.props.onFileClick(fileExt);
                    };
                    return <Button addClass="file-item" click={click}
                               selected={selected}
                               key={order} text={fileExt} />;
                }
                var moveLeft = function() {
                    that.props.onFileMove(that.props.currentFileInd,
                                          that.props.currentFileInd - 1);
                };
                var moveRight = function() {
                    that.props.onFileMove(that.props.currentFileInd,
                                          that.props.currentFileInd + 1);
                };
                var rename = function() {
                    that.props.onFileRename(SKG.util.getFileName(fileExt));
                };
                var del = function() {
                    that.props.onFileDelete(fileExt);
                };

                var left = {text: "move left", icon: "go10", click: moveLeft};
                var right = {text: "move right", icon: "right244",
                             click: moveRight};
                var rename = {text: "rename", icon: "rotate11", click: rename};
                var del = {text: "delete",icon: "close47", click: del};

                var buttons = [];
                if (order != 0)
                    buttons.push(left);
                if (order != that.props.srcFiles.length - 1)
                    buttons.push(right);
                buttons.push(rename);
                buttons.push(del);

                return <ButtonMenu addClass="file-item" text={fileExt}
                           items={buttons} key={order} selected="true" />
            }
        );
        fileButtons.push(function() {
            return (
                <Button icon="add186" addClass="file-item" key="add123"
                    click={that.props.onFileAdd} />
            );
        }());
        return (
            <div className="editor-file-row">
                {fileButtons}
            </div>
        );
    }
});

var EditorPane = React.createClass({
    fileRowHeight: function() {
        if (!this.refs.fileRow)
            return 0;
        return SKG.util.fullElementHeight(this.refs.fileRow.getDOMNode());
    },
    maxHeight: function() {
        var totalHeight = this.fileRowHeight();
        if (this.refs.editor)
            totalHeight += this.refs.editor.maxHeight();
        return totalHeight;
    },
    render: function() {
        var that = this;
        var src = null;
        var run = this.props.onRun;
        if (this.props.currentFileInd >= 0 && this.props.srcTexts) {
            var srcFileName = this.props.srcFiles[this.props.currentFileInd];
            src = this.props.srcTexts[srcFileName];
            run = function(code) {
                that.props.onRun(srcFileName, code);
            };
        }

        var editorPaneCn = "editor-pane";
        if (this.props.isDialogOpen)
            editorPaneCn += "-hidden";

        if (!this.props.highlightable)
            editorPaneCn += " unselectable";

        var realHeight = Math.max(0, this.props.height - this.fileRowHeight());

        return (
            <div className={editorPaneCn}>
                <EditorFileRow ref="fileRow"
                    onFileClick={this.props.onFileClick}
                    onFileRename={this.props.onFileRename}
                    onFileAdd={this.props.onFileAdd}
                    onFileDelete={this.props.onFileDelete}
                    onFileMove={this.props.onFileMove}
                    currentFileInd={this.props.currentFileInd}
                    srcFiles={this.props.srcFiles} />
                <SourceEditor ref="editor" src={src}
                    height={realHeight} resize={this.props.resize}
                    onRun={run} onSave={this.props.onSave} />
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
            collapsed: false,
            editorHeight: 100
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
        if (!this.state.editorHighlightable)
            this.setState({editorHighlightable: true});
    },
    defaultHeight: function() {
        return window.innerHeight - 100;
    },
    height: function() {
        var val = this.getDOMNode().getBoundingClientRect().height;
        return val ? val : 0;
    },
    separatorHeight: function() {
        if (!this.refs.separator)
            return 0;
        return 2 *
            SKG.util.fullElementHeight(this.refs.separator.getDOMNode());
    },
    maxHeight: function() {
        var height = 0;
        if (this.refs.editorPane)
            height = Math.max(height, this.refs.editorPane.maxHeight());
        if (this.refs.contentPane)
            height = Math.max(height, this.refs.contentPane.maxHeight());
        height += this.separatorHeight();
        return height;
    },
    heightTransitionEnd: null,
    setHeight: function(h, trans, transEnd) {
        var clippedHeight = Math.min(h, this.maxHeight());
        var that = this;

        if (this.heightTransitionEnd) {
            this.getDOMNode().removeEventListener(
                "transitionend", this.heightTransitionEnd, false);
            this.heightTransitionEnd = null;
        }

        if (trans) {
            this.getDOMNode().style.transition = "height .3s";
            this.heightTransitionEnd = function() {
                that.setState(
                    {editorHeight: clippedHeight - that.separatorHeight()}
                );
                that.getDOMNode().removeEventListener(
                    "transitionend", that.heightTransitionEnd);
                that.heightTransitionEnd = null;
                if (transEnd)
                    transEnd();
            };
            this.getDOMNode().addEventListener(
                "transitionend", this.heightTransitionEnd, false);
        } else {
            this.getDOMNode().style.transition = null;
            that.setState(
                {editorHeight: clippedHeight - that.separatorHeight()}
            );

        }
        var nh = Math.min(h, this.maxHeight());
        this.getDOMNode().style.height = nh + "px";
    },
    onContentUpdate: function() {
        this.setHeight(this.defaultHeight(), true);
    },
    collapseTransitionEnd: function() {
        this.getDOMNode().removeEventListener(
            "transitionend", this.collapseTransitionEnd);
        this.getDOMNode().style.height = null;
        this.setState({collapsed: true});
    },
    blockExpand: function() {
        if (this.height() < this.defaultHeight()) {
            if (this.state.collapsed) {
               this.setState({collapsed: false});
            }
            this.setHeight(this.defaultHeight(), true);
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
        this.setHeight(30, true, this.collapseTransitionEnd);
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.srcTexts !== prevProps.srcTexts &&
            this.props.currentFileInd >= 0) {
            this.setHeight(this.defaultHeight(), true);
        }
        if (this.state.collapsed != prevState.collapsed && this.refs.editorPane) {
            this.refs.editorPane.forceUpdate();
            this.setHeight(this.defaultHeight(), true);
        }
    },
    componentDidMount: function() {
        this.setHeight(Math.min(this.maxHeight(), this.defaultHeight()));
        window.addEventListener("mouseup", this.mouseUp);
    },
    compnentWillUnmount: function() {
        window.removeEventListener("mouseup", this.mouseUp);
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
                        <Button text={this.props.name} />
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
                    <div className="separator-line-wrapper"
                        onMouseDown={sepUpper}>
                        <div className="separator-line"></div>
                    </div>
                    <Button text={this.props.name} />
                    <Button icon="play107-n" click={this.blockCollapse} />
                    <Button icon="play107-s" click={this.blockExpand} />
                </div>
                <div className="block-content">
                    <ContentPane ref="contentPane" resize={this.onContentUpdate}
                        contentDoms={this.props.contentDoms} block={this.props.name}/>
                    <div className="divide-line-wrapper"
                        onMouseDown={this.verticalDivideMouseDown}>
                        <div className="divide-line"></div>
                    </div>
                    <EditorPane ref="editorPane" resize={this.onContentUpdate}
                        height={this.state.editorHeight}
                        highlightable={this.state.editorHighlightable}
                        onSave={this.props.onSave}
                        onRun={this.props.onRun}
                        onFileClick={this.props.onFileClick}
                        onFileRename={this.props.onFileRename}
                        onFileAdd={this.props.onFileAdd}
                        onFileDelete={this.props.onFileDelete}
                        onFileMove={this.props.onFileMove}
                        isDialogOpen={this.props.isDialogOpen}
                        srcTexts={this.props.srcTexts}
                        srcFiles={this.props.srcFiles}
                        currentFileInd={this.props.currentFileInd} />
                </div>
                <div className="separator">
                    <div className="separator-line-wrapper" onMouseDown={sepLower}>
                        <div className="separator-line"></div>
                    </div>
                    <Button icon="play107-n" click={this.blockCollapse} />
                    <Button icon="play107-s" click={this.blockExpand} />
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
            blocks: [],
            srcFiles: {},
            srcContent: {},
            selectedFile: {},
            contentPaneDoms: {},
            projects: [],
            currentProject: -1,
            isDialogOpen: false
        };
    },
    updateSolution: function(solData, onOk, onFail) {
        var that = this;
        var outerOk = function() {
            that.setState(solData);
            if (onOk) onOk();
        };
        SKG.updateSolution(solData, outerOk, onFail);
    },
    onProjectRename: function(oldProj) {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to change project name");
        };
        var ok = function(text) {
            that.openWorkingDialog();
            SKG.renameProject(
                oldProj,
                text,
                function() {
                    that.closeDialog();
                    var projs = that.state.projects.map(function(p) {
                        return p == oldProj ? text : p;
                    });
                    that.updateSolution(
                        SKG.d(SKG_SOLUTION_PROJECTS, projs).o(), null, fail);
                },
                fail
            );
        };
        this.openTextDialog(oldProj, "Rename project?", ok);
    },
    onProjectClick: function(project) {
        this.updateSolution(
            SKG.d(SKG_SOLUTION_CURRENT_PROJECT, 
                  SKG.util.indexOf(this.state.projects, project)).o()
        );
    },
    onProjectNew: function() {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to create new project.");
        };
        var ok = function(text) {
            that.openWorkingDialog();
            SKG.newProject(
                text,
                function(project) {
                    that.closeDialog();
                    var projs = SKG.util.deepCopy(that.state.projects);
                    projs.push(text);
                    that.updateSolution(
                        SKG.d(SKG_SOLUTION_PROJECTS, projs)
                            .i(SKG_SOLUTION_CURRENT_PROJECT, projs.length -1)
                            .o(), 
                        null, fail);
                },
                fail
            );
        };
        this.openTextDialog(
            this.state.projectName + "-1", "New project name?", ok);
    },
    onProjectDelete: function(proj) {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to delete project"); 
        };
        var ok = function() {
            that.openWorkingDialog();
            SKG.deleteProject(
                proj,
                function() {
                    that.closeDialog();
                    var projs = [];
                    that.state.projects.forEach(function(tproj) {
                        if (tproj != proj)
                            projs.push(that.state.projects[i])
                    });
                    that.updateSolution(
                        SKG.d(SKG_SOLUTION_PROJECTS, projs)
                            .i(SKG_SOLUTION_CURRENT_PROJECT, 0)
                            .o(), 
                        null, fail);
                },
                fail
            );
        };
        this.openBinaryDialog("Delete project?", ok);
    },
    onFileRename: function(proj, block, file) {
        var oldFile = file;
        var that = this;
        var ok = function(newFile) {
            if (newFile === oldFile) return;

            that.openWorkingDialog();
            var oldFileExt = oldFile + ".py";
            var newFileExt = newFile + ".py";
            var ofiles = SKG.util.deepCopy(that.state.srcFiles[block]);
            var nfiles = ofiles.map(function(file) {
                return file==oldFileExt ? newFileExt : file;
            });
            var failedMsg = function() {
                that.openPromptDialog("Failed to change file name");
            };
            var successProj = function() {
                SKG.renameSrcFile(
                    oldFileExt, newFileExt,
                    function() {
                        that.closeDialog();
                        that.setState({srcFiles: nfiles});
                    },
                    function() {
                        failedMsg();
                        // roll back project change
                        console.log("hope we never get here :(");
                        SKG.writeProject({SKG_PROJECT_SRC: ofiles})}
                );
            };

            that.closeDialog();
            var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
            srcFiles[block] = nfiles;

            var srcContent = SKG.util.deepCopy(that.state.srcContent);
            var src = srcContent[oldFileExt];
            delete srcContent[oldFileExt];
            srcContent[newFileExt] = src;

            that.setState({srcFiles: srcFiles, srcContent: srcContent});

            //successFile();
            /*
            SKG.writeProject(
                {SKG_PROJECT_SRC: nfiles},
                successProj,
                failedMsg
            );
            */
        };
        this.openTextDialog(file, "New file name?", ok);
    },
    onFileClick: function(proj, block, file) {
        var ind =
            SKG.util.indexOf(this.state.srcFiles[block], file);
        if (this.state.selectedFile[block] != ind) {
            var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
            selectedFile[block] = ind;
            this.setState({selectedFile: selectedFile});
        }
    },
    onFileAdd: function(proj, block) {
        var that = this;
        var ok = function(fname) {
            var fnameExt = fname + ".py";
            var fileSrc = "# " + fnameExt;
            var ofiles = that.state.srcFiles[block];
            if (SKG.util.indexOf(ofiles, fnameExt) >= 0) {
                that.openPromptDialog("File already exist");
                return;
            }
            that.openWorkingDialog();
            var failedMsg = function() {
                that.openPromptDialog("Failed to add file");
            };
            var nfiles = SKG.util.deepCopy(ofiles).concat([fnameExt]);
            var successFile = function() {
                that.closeDialog();
                var srcContent = SKG.util.deepCopy(that.state.srcContent);
                srcContent[block][fnameExt] = fileSrc;
                var selectedFile =
                    SKG.util.deepCopy(that.state.selectedFile);
                selectedFile[block] = nfiles.length -1;
                that.setState({
                    srcFiles: nfiles,
                    srcContent: srcContent,
                    selectedFile: selectedFile
                });
            };
            var failureFile = function() {
                failedMsg();
                // roll back project change
                console.log("hope we never get here :(");
                //SKG.writeProject({SKG_PROJECT_SRC: ofiles});
            };
            successFile();
/*
            SKG.writeProject(
                {SKG_PROJECT_SRC: nfiles},
                function() {
                    SKG.writeSrcFile(
                        fnameExt, fileSrc, successFile, failureFile); },
                failedMsg
            );
*/
        };
        this.openTextDialog("new", "New file?", ok);
    },
    onBlockDelete: function(block) {
        var ind = SKG.util.indexOf(this.state.blocks, block);
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var srcFiles = SKG.util.deepCopy(this.state.srcFiles);
        var srcContent = SKG.util.deepCopy(this.state.srcContent);
        var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
        var contentPaneDoms = this.state.contentPaneDoms;
        blocks.splice(ind, 1);
        var files = srcFiles[block];
        delete srcFiles[block];
        delete selectedFile[block];
        delete contentPaneDoms[block];
        files.forEach(function(file) {
            delete srcContent[file];
        });
        this.setState({
            blocks: blocks,
            srcFiles: srcFiles,
            srcContent: srcContent,
            selectedFile: selectedFile,
            contentPaneDoms: contentPaneDoms
        });
    },
    onFileDelete: function(proj, block, fname) {
        var fnameExt = fname + ".py";
        var that = this;
        var ok = function() {
            var ofiles = that.state.srcFiles[block];
            var ind = SKG.util.indexOf(ofiles, fname);
            if (ind < 0) {
                that.closeDialog();
                return;
            }
            that.openWorkingDialog();

            var nfiles = SKG.util.deepCopy(ofiles);
            nfiles.splice(ind, 1);

            if (nfiles.length == 0) {
                that.onBlockDelete(block);
                that.closeDialog();
                return;
            }

            var failedMsg = function() {
                that.openPromptDialog("Failed to delete file");
            };
            var successFile = function() {
                that.closeDialog();
                var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
                var selectedFile =
                    SKG.util.deepCopy(that.state.selectedFile);
                srcFiles[block] = nfiles;
                selectedFile[block] = 0;
                that.setState({
                    srcFiles: srcFiles,
                    selectedFile: selectedFile
                });
            };
            var failureFile = function() {
                failedMsg();
                // roll back project change
                console.log("hope we never get here :(");
                SKG.writeProject({SKG_PROJECT_SRC: ofiles});
            };

            successFile();
/*
            SKG.writeProject(
                {SKG_PROJECT_SRC: nfiles},
                function() {
                    SKG.deleteSrcFile(fnameExt, successFile, failureFile);
                },
                failedMsg
            );
*/
        };
        this.openBinaryDialog(
            "Are you sure you'd like to delete " + (fname) + "?", ok);
    },
    onFileMove: function(proj, block, origin, target) {
        if (target < 0 || target >= this.state.srcFiles[block].length)
            return;

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles[block];
        var nfiles = SKG.util.deepCopy(ofiles);

        var tmp = nfiles[origin];
        nfiles[origin] = nfiles[target];
        nfiles[target] = tmp;

        var successProj = function() {
            that.closeDialog();
            var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
            srcFiles[block] = nfiles;
            var selectedFile = SKG.util.deepCopy(that.state.selectedFile);
            selectedFile[block] = target;
            that.setState({
                srcFiles: srcFiles,
                selectedFile: selectedFile
            });
        };
/*
        var failureProj = function() {
            that.openPromptDialog("Failed to change file order");
        };
        SKG.writeProject({SKG_PROJECT_SRC: nfiles}, successProj,
                              failureProj);
*/
        successProj();
    },
    runProg: function(block) {
        // If files are missing, do not run program.
        var files = this.state.srcFiles[block];
        for (var i = 0; i < files.length; i++) {
            if (!this.state.srcContent[files[i]])
                return;
        }
        var that = this;
        var output = function(s) {
            if (s.trim().length > 0)
                that.refs.stdoutConsole.write(block + "> " + s);
        };
        Sk.configure(
            {"output": output, "debugout": output, "read": SKG.builtinRead}
        );

        try {
            var progs = this.state.srcFiles[block].map(function(file) {
                return {name: file, body: that.state.srcContent[file]};
            });
            Sk.importMainWithMultipleFiles(false, progs);
            var ndoms = Sk.progdomIds().map(function(elem) {
                return elem.dom;
            });
            var contentPaneDoms = {};
            for (var i in this.state.contentPaneDoms)
                contentPaneDoms[i] = this.state.contentPaneDoms[i];
            contentPaneDoms[block] = ndoms;
            this.setState({contentPaneDoms: contentPaneDoms});
        } catch (e) {
            console.log("python[ERROR]> " + e.toString());
        }
    },
    onRun: function(block, file, code) {
        this.clientSideSave(block, file, code);
        this.runProg(block);
    },
    clientSideSave: function(block, file, code) {
        if (!file)
            return;
        this.state.srcContent[file] = code;
    },
    onSave: function(file, code, onSuccess, onFail) {
        if (!file)
            return;

        this.clientSideSave(file, code);
        /*
        SKG.writeSrcFile(
            fname, code,
            function() {
                console.log("Successfully wrote " + fname);
                if (onSuccess) onSuccess(); },
            function() {
                console.log("Failed to write " + fname);
                if (onFail) onFail(); }
        );
        */
    },
    onLoadProject: function(projectName, text) {
        var projectBlocks = JSON.parse(text);
        var blocks = [];
        var srcFiles = {};
        var selectedFile = {};
        var that = this;

        projectBlocks.forEach(function(block) {
            blocks.push(block.name);
            srcFiles[block.name] = block.src;
            selectedFile[block.name] = block.defaultFile;
        });

        var runq = function(q, func, onDoneQ) {
            if (q.length < 1) {
                if (onDoneQ) return onDoneQ();
                return null;
            }

            var r = q.splice(0, 1)[0];
            var nextq = q;
            func(r, function() { runq(nextq, func, onDoneQ); });
        };
        var readFile = function(file, onDoneFile) {
            SKG.readSrcFile(
                projectName,
                file,
                function(text) {
                    that.onLoadSource(file, text);
                    onDoneFile();},
                function() { console.log("failed to read " + file); });
        };
        var readBlock = function(block, onDoneBlock) {
            var files = SKG.util.deepCopy(srcFiles[block]);
            var runblock = function() {
                that.runProg(block);
                if (onDoneBlock)
                    onDoneBlock();
            };
            runq(files, readFile, runblock);
        };
        runq(SKG.util.deepCopy(blocks), readBlock);

        that.setState({
            projectName: projectName,
            blocks: blocks,
            srcFiles: srcFiles,
            selectedFile: selectedFile
        });
    },
    onLoadSource: function(file, text) {
        var content = SKG.util.deepCopy(this.state.srcContent);
        content[file] = text;
        this.setState({srcContent: content});
    },
    onLoadSolution: function(text) {
        var solution = JSON.parse(text);
        this.setState(
            SKG.d(SKG_SOLUTION_PROJECTS, solution.projects)
                .i(SKG_SOLUTION_CURRENT_PROJECT, solution.currentProject).o());
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevState.currentProject != this.state.currentProject && this.state.projects) {
            var project = this.state.projects[this.state.currentProject];
            SKG.readProject(
                project, this.onLoadProject.bind(this, project));
        }
    },
    componentDidMount: function() {
        SKG.readSolution(this.onLoadSolution);
    },
    render: function() {
        var proj = this.state.projects && this.state.currentProj ?
            this.state.projects[this.state.currentProject] :
            null;

        var blocks = this.state.blocks.map(function(block) {
            var srcFiles = this.state.srcFiles[block];
            var ind = this.state.selectedFile[block];
            var doms = this.state.contentPaneDoms[block];
            var fileClick = this.onFileClick.bind(this, proj, block);
            var fileRename = this.onFileRename.bind(this, proj, block);
            var fileAdd = this.onFileAdd.bind(this, proj, block);
            var fileDel = this.onFileDelete.bind(this, proj, block);
            var fileMove = this.onFileMove.bind(this, proj, block);
            var run = this.onRun.bind(this, block);
            var save = this.onSave;
            return (
                <WorksheetBlock key={block} srcFiles={srcFiles} name={block}
                    srcTexts={this.state.srcContent} currentFileInd={ind}
                    contentDoms={doms} isDialogOpen={this.state.isDialogOpen}
                    onFileRename={fileRename} onFileAdd={fileAdd}
                    onFileDelete={fileDel} onFileMove={fileMove}
                    onFileClick={fileClick}
                    onRun={run} onSave={save} />
            );
        }.bind(this));

        return (
           <div className="main-panel">
                <HeaderBar projects={this.state.projects}
                    currentProject={this.state.currentProject}
                    onProjectDelete={this.onProjectDelete}
                    onProjectNew={this.onProjectNew}
                    onProjectClick={this.onProjectClick}
                    onProjectRename={this.onProjectRename} />
                <StdoutConsole ref="stdoutConsole" />
                {blocks}
           </div>
        );
    }
});
