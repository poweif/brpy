var StdoutConsole =  React.createClass({
    hideTimeout: null,
    getInitialState: function() {
        return {
            autoHide: false,
            hidden: true,
            content: []
        };
    },
    toggleConsole: function() {
        this.setState({hidden: !this.state.hidden});
    },
    write: function(block, s) {
        if (!s) return;

        if (this.hideTimeout || this.state.hidden) {
            var that = this;
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
            this.hideTimeout = setTimeout(function() {
                that.setState({ hidden: true, autoHide: false });
                that.hideTimeout = null;
            }, 6000);
        }

        var ks = kramed(s);
        var content = this.state.content;
        var contentCn = "content ";
        contentCn += content.length % 2 == 0 ? "content-dark" : "content-light";

        var time = new Date();
        var hours = time.getHours();
        var mins = time.getMinutes();
        var secs = time.getSeconds();
        var infoStr = block + " [" +
            ((hours < 10) ? "0" + hours : hours) + ":" +
            ((mins < 10) ? "0" + mins : mins) + ":" +
            ((secs < 10) ? "0" + secs : secs) + "] > ";

        content.unshift(function() {
            return (
                <div key={content.length} className="single-output">
                    <div className="info">{infoStr}</div>
                    <div className={contentCn}
                        dangerouslySetInnerHTML={{__html: ks}} />
                </div>
            );
        }());

        this.setState({
            hidden: false,
            content: content});
    },
    onClear: function() {
        this.setState({content: []});
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
                <div className="stdout-content">
                   <div className="stdout-content-buttons">
                       <Button icon="do10" click={this.onClear} text="Clear" />
                   </div>
                   <div className="content-wrapper">
                       {this.state.content}
                   </div>
                </div>
                <Button click={this.toggleConsole} icon="show5"
                    addClass={verticalButtonCn} />
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
        var fileButtons = this.props.files.map(
            function(fileData, order) {
                var fileExt = fileData[SKG_FILE_NAME];
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
                if (order != that.props.files.length - 1)
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
            fileName =
                this.props.files[this.props.currentFileInd][SKG_FILE_NAME];
            src = this.props.srcTexts[fileName];
            run = function(code) {
                that.props.onRun(fileName, code);
            };
            save = function(code) {
                that.props.onSave(fileName, code);
            };
        }
        if (!fileName) {
            return (
                <div></div>
            );
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
                    files={this.props.files} />
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
                        files={this.props.files}
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
            blockContent: {},
            srcTexts: {},
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
    updateProject: function(projName, blocks, blockContent, onOk, onFail) {
        var that = this;
        if (!blocks)
            blocks = this.state.blocks;
        if (!blockContent)
            blockContent = this.state.blockContent;
        var outerOk = function() {
            that.setState(
                SKG.d("blocks", blocks)
                    .i("blockContent", blockContent).o());
            if (onOk) onOk();
        };
        var projData = blocks.map(function(block) {
            return blockContent[block];
        })
        SKG.writeProject(projName, projData, outerOk, onFail);
    },
    replaceInFile: function(block, fileName, data, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        var files = content[SKG_BLOCK_SRC];
        var nfiles = files.map(function(file) {
            if (file[SKG_FILE_NAME] == fileName) {
                return SKG.util.copyAndReplace(SKG_SOFT_COPY, file, data);
            }
            return file;
        });
        if (!nfile) return blockContent;
        
        var newContent = SKG.util.copyAndReplace(
            SKG_SOFT_COPY, content, SKG.d(SRC_BLOCK_SRC, nfiles).o());
        return SKG.util.copyAndReplace(
            SKG_SOFT_COPY, blockContent, SKG.d(block, newContent).o());
    },
    replaceInBlock: function(block, data, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        var newContent = SKG.util.copyAndReplace(SKG_SOFT_COPY, content, data);
        return SKG.util.copyAndReplace(
            SKG_SOFT_COPY, blockContent, SKG.d(block, newContent).o());
    },
    onFileRename: function(proj, block, file) {
        var oldFile = file;
        var that = this;
        var ok = function(newFile) {
            if (newFile === oldFile) return;

            that.closeDialog();

            var oldFileExt = oldFile + ".py";
            var newFileExt = newFile + ".py";

            var failed = function() {
                that.openPromptDialog("Failed to change file name");
            };

            var successFile = function() {
                var srcTexts = SKG.util.deepCopy(that.state.srcTexts);
                var src = srcTexts[oldFileExt];
                delete srcTexts[oldFileExt];
                srcTexts[newFileExt] = src;

                var blockContent  =
                    that.replaceInFile(
                        block, oldFileExt,
                        SKG.d(SKG_FILE_NAME, newFileExt).o());

                that.updateProject(
                    proj, null, blockContent,
                    function() { that.setState({srcTexts: srcTexts}); },
                    failed
                );
            };

            SKG.renameSrcFile(
                proj, oldFileExt, newFileExt, successFile, failed);
        };
        this.openTextDialog(file, "New file name?", ok);
    },
    onFileClick: function(proj, block, file) {
        var ind = -1;
        this.state.blockContent[block][SKG_BLOCK_SRC].forEach(
            function(file, ii) {
                if (file[SKG_FILE_NAME] == file)
                    ind = ii;
            }
        );
        if (ind < 0) return;

        var currentFile =
            this.state.blockContent[block][SKG_BLOCK_CURRENT_FILE];
        if (currentFile != ind) {
            var blockContent = this.replaceInBlock(
                block, SKG.d(SKG_BLOCK_CURRENT_FILE, ind).o());
            this.updateProject(proj, null, blockContent);
        }
    },
    onFileAdd: function(proj, block) {
        var that = this;
        var ok = function(fname) {
            var fnameExt = fname + ".py";
            var fileSrc = "# " + fnameExt;
            if (that.state.srcTexts[fnameExt] != null) {
                that.openPromptDialog("File already exist");
                return;
            }
            that.closeDialog();

            var failed = function() {
                that.openPromptDialog("Failed to add file");
            };
            var successFile = function() {
                var srcTexts = SKG.util.deepCopy(that.state.srcTexts);
                srcTexts[fnameExt] = fileSrc;

                var nfiles = SKG.util.deepCopy(
                    that.state.blockContent[block][SKG_BLOCK_SRC]);
                nfiles.push(SKG.d(SKG_FILE_NAME, fnameExt)
                          .i(SKG_FILE_HEIGHT, 100).o());

                var blockContent = that.replaceInBlock(
                    block, SKG.d(SKG_BLOCK_SRC, nfiles)
                        .i(SKG_BLOCK_CURRENT_FILE, nfiles.length - 1).o());

                that.updateProject(
                    proj, null, blockContent,
                    function() { that.setState({srcTexts: srcTexts}); },
                    failed);
            };
            SKG.writeSrcFile(proj, fnameExt, fileSrc, successFile, failed);
        };
        this.openTextDialog("new", "New file?", ok);
    },
    deleteBlock: function(proj, block, onOk, onFail) {
        var ind = SKG.util.indexOf(this.state.blocks, block);
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var blockContent = SKG.util.softCopy(this.state.blockContent);
        var srcTexts = SKG.util.deepCopy(this.state.srcTexts);
        var contentPaneDoms = this.state.contentPaneDoms;
        blockContent[block][SRC_BLOCK_SRC].forEach(function(file) {
            var fileName = file[SKG_FILE_NAME];
            if (srcTexts[fileName])
                delete srcTexts[fileName];
        });

        var ncontent = {};
        var that = this;
        blocks.forEach(function(block) {
            var nfiles = [];
            blockContent[block][SRC_BLOCK_SRC].forEach(function(file) {
                var fileName = file[SKG_FILE_NAME];
                var ext = SKG.util.getFileExt(fileName);
                var name = SKG.util.getFileName(fileName);
                if (ext == 'bk' && name == oldBlock)
                    return;
                nfiles.push(file);
            });
            ncontent[block] =
                that.replaceInBlock(block, SKG.d(SKG_BLOCK_SRC, nfiles).o());
        });

        delete ncontent[block];
        blocks.splice(ind, 1);
        delete contentPaneDoms[block];

        var that = this;
        var onOkInner = function() {
            that.setState({
                srcTexts: srcTexts,
                contentPaneDoms: contentPaneDoms
            });

            if (onOk) onOk();
        };

        this.updateProject(proj, blocks, ncontent, onOkInner, onFail);
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
            var ind = -1;
            that.state.blockContent[block][SKG_BLOCK_SRC].forEach(
                function(file, fileInd) {
                    if (file[SKG_FILE_NAME] == fname)
                        ind = fileInd;
                }
            );
            if (ind < 0) return success();

            var successFile = function() {
                that.closeDialog();
                var nfiles =
                    SKG.util.deepCopy(
                        that.state.blockContent[block][SKG_BLOCK_SRC]);
                nfiles.splice(ind, 1);
                var blockContent = that.replaceInBlock(
                    block, SKG.d(SKG_BLOCK_SRC, nfiles)
                        .i(SKG_BLOCK_CURRENT_FILE, 0).o());
                that.updateProject(proj, null, blockContent, success, failed);
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
        if (target < 0 || 
            target >= this.state.blockContent[block][SKG_BLOCK_SRC].length)
            return;

        var that = this;
        var nfiles = SKG.util.softCopy(
            that.state.blockContent[block][SKG_BLOCK_SRC]);

        var tmp = nfiles[origin];
        nfiles[origin] = nfiles[target];
        nfiles[target] = tmp;

        var blockContent = this.replaceInBlock(
            block,
            SKG.d(SRC_BLOCK_SRC, nfiles)
                .i(SRC_BLOCK_CURRENT_FILE, target).o());
        this.updateProject(proj, blockContent, null,
            that.openPromptDialog("Failed to change file order"));
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

            var blocks = SKG.util.deepCopy(that.state.blocks);
            blocks.push(newBlock);

            var blockContent = SKG.util.softCopy(that.state.blockContent);
            blockContent[newBlock] = SKG
                .d(SRC_BLOCK_SRC, [])
                .i(SRC_BLOCK_NAME, newBlock)
                .i(SRC_CURRENT_FILE, -1)
                .I(SRC_COLLAPSED, false);

            var doms = that.state.contentPaneDoms;
            doms[newBlock] = [];
            that.setState({contentPaneDoms: doms});

            that.updateProject(
                proj, blocks, blockContent,
                that.onFileMoveToBlock(proj, oldBlock, newBlock, fileExt),
                that.openPromptDialog("Failed to add new block"));
        };
        this.openTextDialog(file, "New Block?", ok);
    },
    onFileMoveToBlock: function(proj, oldBlock, newBlock, file) {
        var that = this;
        var oldBlockFiles = [];
        var fileData = null;
        var blocks = null;
        this.state.blockContent[oldBlock][SKG_BLOCK_SRC].forEach(
            function(cfile) {
                if (file != cfile[SKG_FILE_NAME])
                    oldBlockFiles.push(cfile);
                else
                    fileData = cfile;
            }
        );
        var newBlockFiles = SKG.util.softCopy(
            this.state.blockContent[newBlock][SKG_BLOCK_SRC]);
        newBlockFiles.push(fileData);

        var blockContent = SKG.util.softCopy(this.state.blockContent);
        if (oldBlockFiles.length > 0) {
            blockContent[oldBlock] = this.replaceInBlock(
                oldBlock, SKG.d(SKG_BLOCK_SRC, oldBlockFiles).o());
            blockContent[newBlock] = this.replaceInBlock(
                newBlock, SKG.d(SKG_BLOCK_SRC, newBlockFiles).o());
        } else {
            var doms = this.state.contentPaneDoms;
            blocks = SKG.util.softCopy(this.state.blocks);
            var blockInd = SKG.util.indexOf(blocks, oldBlock);
            blocks.splice(blockInd, 1);
            delete blockContent[oldBlock];
            delete doms[oldBlock];
        }
        var onOk = function() {
            that.runProg(newBlock);
            if (oldBlockFiles.length > 0)
                that.runProg(oldBlock);
        };
        this.updateProject(
            proj, blocks, blockContent, onOk,
            that.openPromptDialog("Failed to move block"));
    },
    checkCircularBlockLinks: function(block, blockContent, checked) {
        if (checked[block])
            return true;
        checked[block] = true;
        var files = blockContent[block][SKG_BLOCK_SRC];
        var res = false;
        for (var i = 0; i < files.length; i++) {
            var fname = files[i][SKG_FILE_NAME];
            var ext = SKG.util.getFileExt(fname);
            var name = SKG.util.getFileName(fname);
            if (ext == 'bk')
                res = res || this.checkCircularBlockLinks(name, blockContent, checked);
        }
        return res;
    },
    onBlockLinkAdd: function(proj, block, blockLink) {
        var that = this;
        var blockLinkExt = blockLink + ".bk"
        var nfiles = SKG.util.softCopy(
            this.state.blockContent[block][SRC_BLOCK_SRC]);
        nfiles.unshift(SKG.d(SKG_FILE_NAME, blockLinkExt).o());
        var srcFileNames = nfiles.map(function(file) {
            return file[SKG_FILE_NAME];
        });

        if (this.checkCircularBlockLinks(block, this.state.blockContent, {})) {
            that.openPromptDialog("Failed because of circular dependency.");
            return;
        }
        var currentFile =
            this.state.blockContent[block][SKG_BLOCK_CURRENT_FILE];
        var blockContent = this.replaceInBlock(
            block,
            SKG.d(SKG_BLOCK_CURRENT_FILE, currentFile + 1)
                .i(SKG_BLOCK_SRC, nfiles).o());

        this.updateProject(
            proj, null, blockContent,
            this.runProg.bind(this, block),
            that.openPromptDialog("Failed to add block link"));
    },
    onBlockRename: function(proj, oldBlock) {
        var that = this;
        var ok = function(newBlock) {
            if (newBlock === oldBlock) return;

            if (SKG.util.indexOf(that.state.blocks, newBlock) >=0) {
                that.openPromptDialog("Block name already exists");
                return;
            }
            var blocks = SKG.util.deepCopy(that.state.blocks).map(
                function(b) { return b == oldBlock ? newBlock : b; });
            var blockContent = SKG.softCopy(that.state.blockContent);
            var files = blockContent[oldBlock];
            delete blockContent[oldBlock];
            blockContent[newBlock] = files;

            var doms = that.state.contentPaneDoms;
            var dom = doms[oldBlock];
            delete doms[oldBlock];
            doms[newBlock] = dom;

            blocks.forEach(function(block) {
                var nfiles = blockContent[block][SKG_BLOCK_SRC].map(
                    function(file) {
                        var nfile = SKG.util.softCopy(file);
                        var fileName = file[SKG_FILE_NAME];
                        var ext = SKG.util.getFileExt(fileName);
                        var name = SKG.util.getFileName(fileName);
                        if (ext == 'bk' && name == oldBlock) {
                            nfile[SKG_FILE_NAME] = newBlock + '.bk';
                            return nfile;
                        }
                        return file;
                    });
                blockContent[block][SKG_BLOCK_SRC] = nfiles;
            });

            var blockOk = function() {
                that.setState({contentPaneDoms: doms});
                that.closeDialog();
            };
            that.updateProject(
                proj, blocks, blockContent, blockOk, 
                that.openPromptDialog("Failed to rename block."));
        };
        this.openTextDialog(oldBlock, "Rename block?", ok);
    },
    onBlockMove: function(proj, origin, target) {
        var that = this;
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var blockName = blocks[origin];
        blocks[origin] = blocks[target];
        blocks[target] = blockName;
        this.updateProject(proj, blocks, null, null, 
            that.openPromptDialog("Failed to move block."));
    },
    collectSrc: function(block) {
        var that = this;
        var ret = [];
        this.state.blockContent[block][SKG_BLOCK_SRC].forEach(
            function(file) {
                var fileName = file[SKG_FILE_NAME];
                var ext = SKG.util.getFileExt(fileName);
                if (ext == 'py') {
                    ret.push(
                        { name: fileName, 
                          body: that.state.srcTexts[fileName] });
                } else if (ext == 'bk') {
                    var block = SKG.util.getFileName(fileExt);
                    ret = ret.concat(that.collectSrc(block));
                }
            }
        );
        return ret;
    },
    runProg: function(block) {
        var that = this;
        // If files are missing, do not run program.
        var files = this.state.blockContent[block][SKG_BLOCK_SRC];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var fileName = file[SKG_FILE_NAME];
            if (SKG.util.getFileExt(fileName) == 'bk')
                continue;
            if (!this.state.srcTexts[fileName])
                return;
        }
        var output = function(s) {
            that.refs.stdoutConsole.write(block, s);
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
        this.runProg(block);
    },
    clientSideSave: function(block, file, code) {
        if (!file)
            return;
        this.state.srcTexts[file] = code;
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
        var blockContent = {};
        var that = this;

        console.log(text);
        console.log(projectBlocks);

        projectBlocks.forEach(function(block) {
            var blockName = block.name;
            blocks.push(blockName);
            delete block['name'];
            blockContent[blockName] = SKG.util.deepCopy(block);
        });

        console.log(blockContent);
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
            console.log(block, blockContent[block], SKG_BLOCK_SRC);
            console.log(blockContent[block][SKG_BLOCK_SRC]);
            var files = blockContent[block][SKG_BLOCK_SRC].map(function(file) {
                return file[SKG_FILE_NAME];
            });
            console.log(files);
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
            blockContent: blockContent
        });
    },
    onLoadSource: function(file, text) {
        var content = SKG.util.deepCopy(this.state.srcTexts);
        content[file] = text;
        this.setState({srcTexts: content});
    },
    onLoadSolution: function(text) {
        var solution = JSON.parse(text);
        this.setState(
            SKG.d(SKG_SOLUTION_PROJECTS, solution.projects)
                .i(SKG_SOLUTION_CURRENT_PROJECT, solution.currentProject).o());
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevState.currentProject != this.state.currentProject && this.state.projects) {
            this.refs.stdoutConsole.onClear();
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
                    click: that.onFileMoveToBlock.bind(
                        that, proj, block, iblock)
                });
                var fileNames = that.state.blockContent[SKG_BLOCK_SRC].map(
                    function(file) { return file[SKG_FILE_NAME]; });
                if (SKG.util.indexOf(fileNames, iblock + '.bk') < 0) {
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
            var files = this.state.blockContent[block][SKG_BLOCK_SRC];
            var fileInd = this.state.blockContent[block][SKG_BLOCK_CURRENT_FILE];
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
                <WorksheetBlock key={block} files={files} name={block}
                    srcTexts={this.state.srcTexts} currentFileInd={fileInd}
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
