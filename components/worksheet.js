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

        if (this.props.isDialogOpen)
            stdoutCn += "-backgrounded";

        if (this.state.hidden) {
            stdoutCn += " stdout-console-hide";
            buttonImg = "/img/sort52.png";
            verticalButtonCn += " vertical-button-hide";
        }
        return (
            <div className={stdoutCn}>
                <textarea ref="tarea" readOnly></textarea>
                <img src={buttonImg} className={verticalButtonCn}
                     onClick={this.toggleConsole} />
            </div>
        )
    }
});

var HeaderBar = React.createClass({
    render: function(){
        if (!this.props.projects)
            return null;

        var that = this;
        var current = this.props.projects[this.props.currentProject];
        var buttons = [{text: "Switch to project", hr: true}];
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
            {text: "Project options", hr: true},
            {text: "new", click: this.props.onProjectNew, icon: "add186"},
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
                var isBlockLink = SKG.util.getFileExt(fileExt) == 'bk';
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
                var renameFunc = function() {
                    that.props.onFileRename(SKG.util.getFileName(fileExt));
                };

                var delFunc = function() {
                    that.props.onFileDelete(fileExt);
                };
                var blocks = that.props.onFileMoveToBlocks ?
                    that.props.onFileMoveToBlocks.map(function(block) {
                        return {
                            text: block.name,
                            click: function() {
                                block.click(fileExt);
                            }
                        };
                    }) : [];

                var newBlockClick = function() {
                    that.props.onFileMoveToNewBlock(fileExt);
                };

                var nblocks =
                    [{icon: 'crop13', text: 'new block', click: newBlockClick}];
                if (blocks.length > 0) {
                    nblocks.push({hr: true, text: 'blocks'});
                    nblocks = nblocks.concat(blocks);
                }

                var left = {text: "move left", icon: "go10", click: moveLeft};
                var right = {text: "move right", icon: "right244",
                             click: moveRight};
                var rename = !isBlockLink ?
                    {text: "rename", icon: "rotate11", click: renameFunc} :
                    null;
                var del = {text: "delete", icon: "close47", click: delFunc};

                var buttons = [];
                if (order != 0) buttons.push(left);
                if (order != that.props.srcFiles.length - 1)
                    buttons.push(right);

                buttons.push(rename);
                buttons.push(del);

                if (!isBlockLink) {
                    buttons.push(
                        {text: "move to", icon: "forward18", items: nblocks});
                }

                return <ButtonMenu addClass="file-item" text={fileExt}
                           items={buttons} key={order} selected="true" />
            }
        );
        fileButtons.push(function() {
            var items = [
                {text: "add source", icon: "create3",
                 click: that.props.onFileAdd}
            ];
            if (that.props.onBlockLinkAdds) {
                items.push({text: "Link to block", hr: true});
                items = items.concat(that.props.onBlockLinkAdds);
            }
            return (
                <ButtonMenu icon="add186" addClass="file-item" key="add123"
                    items={items} />
            );
        }());
        return (
            <div className="editor-file-row">
                {fileButtons}
            </div>
        );
    }
});

var BlockLinkPane = React.createClass({
    maxHeight: function() {
        return 40;
    },
    componentDidMount: function() {
        if (this.props.resize)
            this.props.resize();
    },
    render: function() {
        var block = SKG.util.getFileName(this.props.block);
        return (
            <div className="block-link-pane">
                <div className="content">the {block} block</div>
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
        var run = null;
        var save = null;
        var fileName = null;
        if (this.props.currentFileInd >= 0 && this.props.srcTexts) {
            fileName = this.props.srcFiles[this.props.currentFileInd];
            src = this.props.srcTexts[fileName];
            run = function(code) {
                that.props.onRun(fileName, code);
            };
            save = function(code) {
                that.props.onSave(fileName, code);
            };
        }

        var editorPaneCn = "editor-pane";
        if (this.props.isDialogOpen)
            editorPaneCn += "-backgrounded";

        if (!this.props.highlightable)
            editorPaneCn += " unselectable";

        var realHeight = Math.max(0, this.props.height - this.fileRowHeight());

        var sourceEditor = src ? function() {
            return (
                <SourceEditor ref="editor" src={src}
                    height={realHeight} resize={that.props.resize}
                    onRun={run} onSave={save} />
            );
        }() : function() {
            return (
                <BlockLinkPane ref="editor" resize={that.props.resize}
                    block={fileName} />
            );
        }();

        return (
            <div className={editorPaneCn}>
                <EditorFileRow ref="fileRow"
                    onFileClick={this.props.onFileClick}
                    onFileRename={this.props.onFileRename}
                    onFileAdd={this.props.onFileAdd}
                    onFileDelete={this.props.onFileDelete}
                    onFileMove={this.props.onFileMove}
                    onFileMoveToBlocks={this.props.onFileMoveToBlocks}
                    onFileMoveToNewBlock={this.props.onFileMoveToNewBlock}
                    onBlockLinkAdds={this.props.onBlockLinkAdds}
                    currentFileInd={this.props.currentFileInd}
                    srcFiles={this.props.srcFiles} />
                {sourceEditor}
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
        var that = this;
        var blockMenu = function() {
            var items = [];
            if (this.props.onBlockMoveUp)
                items.push(
                    {text: "move up", click: this.props.onBlockMoveUp,
                     icon: "right244-n"});
            if (this.props.onBlockMoveDown)
                items.push(
                    {text: "move down", click: this.props.onBlockMoveDown,
                     icon: "right244-s"});
            items.push({text: "rename", click: this.props.onBlockRename,
                        icon: "rotate11"});
            return (
                <ButtonMenu right items={items} text={this.props.name} />
            );
        }.bind(this)();

        if (this.state.collapsed) {
            return (
                <div className="worksheet-block">
                    <div className="separator">
                        <div className="collapsed-line-wrapper"
                            onClick={this.blockExpand}>
                            <div className="collapsed-line"></div>
                        </div>
                        {blockMenu}
                    </div>
                </div>
            );
        }

        var makeSeparator = function(upper) {
            var mouseDown = function(e) {
                this.separatorMouseDown(upper, e);
            }.bind(that);
            return (
                <div ref="separator" className="separator">
                    <div className="separator-line-wrapper"
                        onMouseDown={mouseDown}>
                        <div className="separator-line"></div>
                    </div>
                    {upper ? blockMenu : null}
                    <Button icon="rounded56" click={that.blockCollapse} />
                    <Button icon="add182" click={that.blockExpand} />
                </div>
            );
        };

        var sepUpper = makeSeparator(true);
        var sepLower = makeSeparator(false);

        return (
            <div className="worksheet-block">
                {sepUpper}
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
                        onFileMoveToBlocks={this.props.onFileMoveToBlocks}
                        onFileMoveToNewBlock={this.props.onFileMoveToNewBlock}
                        onBlockLinkAdds={this.props.onBlockLinkAdds}
                        isDialogOpen={this.props.isDialogOpen}
                        srcTexts={this.props.srcTexts}
                        srcFiles={this.props.srcFiles}
                        currentFileInd={this.props.currentFileInd} />
                </div>
                {sepLower}
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
                            projs.push(tproj);
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
    updateProject: function(proj, blocks, srcFiles, selectedFile, onOk, onFail) {
        var that = this;
        if (!blocks)
            blocks = this.state.blocks;
        if (!srcFiles)
            srcFiles = this.state.srcFiles;
        if (!selectedFile)
            selectedFile = this.state.selectedFile;
        var outerOk = function() {
            that.setState(
                SKG.d("blocks", blocks)
                    .i("srcFiles", srcFiles)
                    .i("selectedFile", selectedFile).o());
            if (onOk) onOk();
        };
        var projData = SKG.buildProjectJson(blocks, srcFiles, selectedFile);
        SKG.writeProject(proj, projData, outerOk, onFail);
    },
    onFileRename: function(proj, block, file) {
        var oldFile = file;
        var that = this;
        var ok = function(newFile) {
            if (newFile === oldFile) return;

            var oldFileExt = oldFile + ".py";
            var newFileExt = newFile + ".py";
            var ofiles = SKG.util.deepCopy(that.state.srcFiles[block]);
            var nfiles = ofiles.map(function(file) {
                return file==oldFileExt ? newFileExt : file;
            });
            var failed = function() {
                that.openPromptDialog("Failed to change file name");
            };
            var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
            srcFiles[block] = nfiles;

            var srcContent = SKG.util.deepCopy(that.state.srcContent);
            var src = srcContent[oldFileExt];
            delete srcContent[oldFileExt];
            srcContent[newFileExt] = src;

            var successFile = function() {
                that.updateProject(
                    proj, null, srcFiles, null,
                    function() { that.setState({srcContent: srcContent}); },
                    failed
                );
            };

            SKG.renameSrcFile(proj, oldFileExt, newFileExt, successFile,
                              failed);
        };
        this.openTextDialog(file, "New file name?", ok);
    },
    onFileClick: function(proj, block, file) {
        var ind =
            SKG.util.indexOf(this.state.srcFiles[block], file);
        if (this.state.selectedFile[block] != ind) {
            var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
            selectedFile[block] = ind;
            this.updateProject(proj, null, null, selectedFile, null, null);
        }
    },
    onFileAdd: function(proj, block) {
        var that = this;
        var ok = function(fname) {
            var fnameExt = fname + ".py";
            var fileSrc = "# " + fnameExt;
            var ofiles = that.state.srcFiles[block];
            if (that.state.srcContent[fnameExt] != null) {
                that.openPromptDialog("File already exist");
                return;
            }
            that.closeDialog();
            var failed = function() {
                that.openPromptDialog("Failed to add file");
            };
            var nfiles = SKG.util.deepCopy(ofiles).concat([fnameExt]);

            var successFile = function() {
                var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
                var srcContent = SKG.util.deepCopy(that.state.srcContent);
                var selectedFile =
                    SKG.util.deepCopy(that.state.selectedFile);
                srcFiles[block] = nfiles;
                srcContent[fnameExt] = fileSrc;
                selectedFile[block] = nfiles.length -1;
                var projOk =
                    function() { that.setState({srcContent: srcContent}); };
                that.updateProject(
                    proj, null, srcFiles, selectedFile, projOk, failed);
            };
            SKG.writeSrcFile(proj, fnameExt, fileSrc, successFile, failed);
        };
        this.openTextDialog("new", "New file?", ok);
    },
    deleteBlock: function(proj, block, onOk, onFail) {
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
            if (srcContent[file])
                delete srcContent[file];
        });

        block.forEach(function(block) {
            var nfiles = [];
            srcFiles[block].forEach(function(file) {
                var ext = SKG.util.getFileExt(file);
                var name = SKG.util.getFileName(file);
                if (ext == 'bk' && name == oldBlock)
                    return;
                nfiles.push(file);
            });
            srcFiles[block] = nfiles;
        });

        var that = this;
        var onOkInner = function() {
            that.setState({
                srcContent: srcContent,
                contentPaneDoms: contentPaneDoms
            });

            if (onOk) onOk();
        };

        this.updateProject(
            proj, blocks, srcFiles, selectedFile, onOkInner, onFail);
    },
    onFileDelete: function(proj, block, fname) {
        var that = this;

        var failed = function() {
            that.openPromptDialog("Failed to delete file");
        };
        var success = function() {
            if (SKG.util.getFileExt(fname) == 'bk')
                that.runProg(block);
            that.closeDialog();
        };

        var ok = function() {
            var ofiles = that.state.srcFiles[block];
            var ind = SKG.util.indexOf(ofiles, fname);
            if (ind < 0) return success();

            var nfiles = SKG.util.deepCopy(ofiles);
            nfiles.splice(ind, 1);

            var successFile = function() {
                that.closeDialog();
                var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
                var selectedFile =
                    SKG.util.deepCopy(that.state.selectedFile);
                srcFiles[block] = nfiles;
                selectedFile[block] = 0;

                that.updateProject(
                    proj, null, srcFiles, selectedFile, success, failed);
            };

            if (nfiles.length == 0) {
                successFile = function() {
                    that.deleteBlock(proj, block, null, failed);
                };
            }

            SKG.deleteSrcFile(proj, fname, successFile, failed);
        };
        this.openBinaryDialog(
            "Are you sure you'd like to delete " + (fname) + "?", ok);
    },
    onFileMove: function(proj, block, origin, target) {
        if (target < 0 || target >= this.state.srcFiles[block].length)
            return;

        var that = this;
        var ofiles = this.state.srcFiles[block];
        var nfiles = SKG.util.deepCopy(ofiles);

        var tmp = nfiles[origin];
        nfiles[origin] = nfiles[target];
        nfiles[target] = tmp;

        var failed = function() {
            that.openPromptDialog("Failed to change file order");
        };
        var srcFiles = SKG.util.deepCopy(this.state.srcFiles);
        srcFiles[block] = nfiles;
        var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
        selectedFile[block] = target;
        this.updateProject(proj, null, srcFiles, selectedFile, null, failed);
    },
    onFileMoveToNewBlock: function(proj, oldBlock, fileExt) {
        var file = SKG.util.getFileName(fileExt);
        var that = this;
        var ok = function(newBlock) {
            if (SKG.util.indexOf(that.state.blocks, newBlock) >= 0) {
                that.openPromptDialog("Block name already exist");
                return;
            }
            that.closeDialog();
            var failed = function() {
                that.openPromptDialog("Failed to add new block");
            };

            var blocks = SKG.util.deepCopy(that.state.blocks);
            blocks.push(newBlock);
            var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
            srcFiles[newBlock] = [];
            var selectedFile = SKG.util.deepCopy(that.state.selectedFile);
            selectedFile[newBlock] = -1;

            var doms = that.state.contentPaneDoms;
            doms[newBlock] = [];
            that.setState({contentPaneDoms: doms});

            var onOk = function() {
                that.onFileMoveToBlock(proj, oldBlock, newBlock, fileExt);
            };
            that.updateProject(
                proj, blocks, srcFiles, selectedFile, onOk, failed);
        };
        this.openTextDialog(file, "New Block?", ok);
    },
    onFileMoveToBlock: function(proj, oldBlock, newBlock, file) {
        var oldBlockFiles = [];
        this.state.srcFiles[oldBlock].forEach(function(cfile) {
            if (file != cfile)
                oldBlockFiles.push(cfile);
        });
        var newBlockFiles = SKG.util.deepCopy(this.state.srcFiles[newBlock]);
        newBlockFiles.push(file);

        var srcFiles = SKG.util.deepCopy(this.state.srcFiles);
        var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
        var blocks = null;
        var that = this;

        srcFiles[newBlock] = newBlockFiles;
        selectedFile[newBlock] = newBlockFiles.length - 1;

        if (oldBlockFiles.length > 0) {
            srcFiles[oldBlock] = oldBlockFiles;
            selectedFile[oldBlock] = 0;
        } else {
            var doms = this.state.contentPaneDoms;
            blocks = [];
            this.state.blocks.forEach(function(block) {
                if (block != oldBlock)
                    blocks.push(block);
            });
            delete srcFiles[oldBlock];
            delete selectedFile[oldBlock];
            delete doms[oldBlock];
        }

        var failed = function() {
            that.openPromptDialog("Failed to move block");
        };

        var onOk = function() {
            that.runProg(newBlock);
            if (oldBlockFiles.length > 0)
                that.runProg(oldBlock);
        };

        this.updateProject(proj, blocks, srcFiles, selectedFile, onOk, failed);
    },
    checkCircularBlockLinks: function(block, srcFiles, checked) {
        if (checked[block])
            return true;
        checked[block] = true;
        var files = srcFiles[block];
        var res = false;
        for (var i = 0; i < files.length; i++) {
            var ext = SKG.util.getFileExt(files[i]);
            var name = SKG.util.getFileName(files[i]);
            if (ext == 'bk')
                res = res || this.checkCircularBlockLinks(name, srcFiles, checked);
        }
        return res;
    },
    onBlockLinkAdd: function(proj, block, blockLink) {
        var that = this;
        var blockLinkExt = blockLink + ".bk"
        var srcFiles = SKG.util.deepCopy(this.state.srcFiles);
        srcFiles[block].unshift(blockLinkExt);

        if (this.checkCircularBlockLinks(block, srcFiles, {})) {
            that.openPromptDialog("Failed because of circular dependency.");
            return;
        }
        var failed = function() {
            that.openPromptDialog("Failed to add block link");
        };

        var selectedFile = SKG.util.deepCopy(this.state.selectedFile);
        selectedFile[block] = selectedFile[block] + 1;

        this.updateProject(
            proj, null, srcFiles, selectedFile, this.runProg.bind(this, block),
            failed);
    },
    onBlockRename: function(proj, oldBlock) {
        var that = this;
        var failed = function() {
            that.openPromptDialog("Failed to rename block.");
        };

        var ok = function(newBlock) {
            if (newBlock === oldBlock) return;

            if (SKG.util.indexOf(that.state.blocks, newBlock) >=0) {
                that.openPromptDialog("Block name already exists");
                return;
            }

            var blocks = SKG.util.deepCopy(that.state.blocks);
            var srcFiles = SKG.util.deepCopy(that.state.srcFiles);
            var selectedFile = SKG.util.deepCopy(that.state.selectedFile);
            var doms = that.state.contentPaneDoms;

            blocks = blocks.map(function(b) {
                if (b == oldBlock)
                    return newBlock;
                return b;
            });
            var files = srcFiles[oldBlock];
            delete srcFiles[oldBlock];
            srcFiles[newBlock] = files;

            var selected = selectedFile[oldBlock];
            delete selectedFile[oldBlock];
            selectedFile[newBlock] = selected;

            var dom = doms[oldBlock];
            delete doms[oldBlock];
            doms[newBlock] = dom;

            blocks.forEach(function(block) {
                srcFiles[block] = srcFiles[block].map(function(file) {
                    var ext = SKG.util.getFileExt(file);
                    var name = SKG.util.getFileName(file);
                    if (ext == 'bk' && name == oldBlock)
                        return newBlock + '.bk';
                    return file;
                });
            });

            var blockOk = function() {
                that.setState({contentPaneDoms: doms});
                that.closeDialog();
            };

            that.updateProject(
                proj, blocks, srcFiles, selectedFile, blockOk, failed);
        };
        this.openTextDialog(oldBlock, "Rename block?", ok);
    },
    onBlockMove: function(proj, origin, target) {
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var blockName = blocks[origin];
        var that = this;
        blocks[origin] = blocks[target];
        blocks[target] = blockName;
        var failed = function() {
            that.openPromptDialog("Failed to move block.");
        };
        this.updateProject(proj, blocks, null, null, null, failed);
    },
    collectSrc: function(block) {
        var that = this;
        var ret = [];
        this.state.srcFiles[block].forEach(function(fileExt) {
            var ext = SKG.util.getFileExt(fileExt);
            if (ext == 'py') {
                ret.push({name: fileExt, body: that.state.srcContent[fileExt]});
            } else if (ext == 'bk') {
                var block = SKG.util.getFileName(fileExt);
                ret = ret.concat(that.collectSrc(block));
            }
        });
        return ret;
    },
    runProg: function(block) {
        // If files are missing, do not run program.
        var files = this.state.srcFiles[block];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (SKG.util.getFileExt(file) == 'bk')
                continue;
            if (!this.state.srcContent[file])
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

        var progs = this.collectSrc(block);
        try {
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
    onRun: function(proj, block, file, code) {
        //this.clientSideSave(block, file, code);
//        this.onSave(proj, block, file, code, null, null);
        this.runProg(block);
    },
    clientSideSave: function(block, file, code) {
        if (!file)
            return;
        this.state.srcContent[file] = code;
    },
    onSave: function(proj, block, file, code, onSuccess, onFail) {
        if (!file)
            return;

        this.clientSideSave(block, file, code);
        SKG.writeSrcFile(
            proj, file, code,
            function() {
                console.log("Successfully wrote " + file);
                if (onSuccess) onSuccess(); },
            function() {
                console.log("Failed to write " + file);
                if (onFail) onFail(); }
        );
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
            selectedFile[block.name] = block.currentFile;
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
            if (SKG.util.getFileExt(file) == 'bk') return onDoneFile();

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
                if (onDoneBlock)
                    onDoneBlock();
            };
            runq(files, readFile, runblock);
        };
        var allDone = function() {
            blocks.forEach(function(block) {
                that.runProg(block);
            });
        };

        runq(SKG.util.deepCopy(blocks), readBlock, allDone);

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
        console.log(solution);
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
        var proj = this.state.projects && (this.state.currentProject != null) ?
            this.state.projects[this.state.currentProject] :
            null;

        var that = this;
        var blocks = this.state.blocks.map(function(block, index) {
            var fileMoveToBlocks = null;
            var blockLinkAdds = null;

            this.state.blocks.forEach(function(iblock) {
                if (iblock == block) return;

                if (!fileMoveToBlocks) fileMoveToBlocks = [];
                fileMoveToBlocks.push({
                    name: iblock,
                    click: that.onFileMoveToBlock.bind(that, proj, block, iblock)
                });
                if (SKG.util.indexOf(that.state.srcFiles[block],iblock + '.bk')
                    < 0) {
                    if (!blockLinkAdds) blockLinkAdds = [];
                    blockLinkAdds.push({
                        text: iblock,
                        click: that.onBlockLinkAdd.bind(
                            that, proj, block, iblock)
                    });
                }
            });

            var fileMoveToNewBlock =
                this.onFileMoveToNewBlock.bind(this, proj, block);
            var srcFiles = this.state.srcFiles[block];
            var fileInd = this.state.selectedFile[block];
            var doms = this.state.contentPaneDoms[block];
            var fileClick = this.onFileClick.bind(this, proj, block);
            var fileRename = this.onFileRename.bind(this, proj, block);
            var fileAdd = this.onFileAdd.bind(this, proj, block);
            var fileDel = this.onFileDelete.bind(this, proj, block);
            var fileMove = this.onFileMove.bind(this, proj, block);
            var blockRename = this.onBlockRename.bind(this, proj, block);
            var blockMoveUp = null;
            var blockMoveDown = null;
            if (index >= 1 && this.state.blocks.length > 1) {
                blockMoveUp =
                    this.onBlockMove.bind(this, proj, index, index - 1);
            }
            if (index < this.state.blocks.length - 1 &&
                this.state.blocks.length > 1) {
                blockMoveDown =
                    this.onBlockMove.bind(this, proj, index, index + 1);
            }

            var run = this.onRun.bind(this, proj, block);
            var save = this.onSave.bind(this, proj, block);
            return (
                <WorksheetBlock key={block} srcFiles={srcFiles} name={block}
                    srcTexts={this.state.srcContent} currentFileInd={fileInd}
                    contentDoms={doms} isDialogOpen={this.state.isDialogOpen}
                    onFileRename={fileRename} onFileAdd={fileAdd}
                    onFileDelete={fileDel} onFileMove={fileMove}
                    onFileClick={fileClick} onBlockRename={blockRename}
                    onBlockMoveUp={blockMoveUp} onBlockMoveDown={blockMoveDown}
                    onFileMoveToBlocks={fileMoveToBlocks}
                    onFileMoveToNewBlock={fileMoveToNewBlock}
                    onBlockLinkAdds={blockLinkAdds}
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
                <StdoutConsole ref="stdoutConsole"
                    isDialogOpen={this.state.isDialogOpen}/>
                {blocks}
           </div>
        );
    }
});
