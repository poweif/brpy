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
            }, 4000);
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
                       <Button icon="do10" click={this.onClear} text="clear" />
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

var ProjectBar = React.createClass({
    render: function(){
        if (!this.props.projects)
            return null;

        var that = this;
        var current = this.props.projects[this.props.currentProject];
        var buttons = [];
        if (this.props.projects && this.props.projects.length > 1) {
            buttons = [{text: "other projects", hr: true}];
            buttons = buttons.concat(
                this.props.projects.map(function(proj) {
                    if (proj == current)
                        return null;
                    var projectClick = function() {
                        if (that.refs.menu)
                            that.refs.menu.hide();
                        return that.props.onProjectClick(proj);
                    };
                    var importBlock = function() {
                        if (that.refs.menu)
                            that.refs.menu.hide();
                        return that.props.onImportBlock(proj);
                    };

                    var items = [
                      {text: 'switch to', icon: 'play109' ,
                       click: projectClick},
                      {text: 'import block', icon: 'download164',
                       click: importBlock}
                    ];
                    return {text: proj, items: items};
                })
            );
        }
        var rename = function() { return that.props.onProjectRename(current); };
        var del = function() { return that.props.onProjectDelete(current); };
        buttons = buttons.concat([
            {text: "project options", hr: true},
            {text: "new", click: this.props.onProjectNew, icon: "add186"},
            {text: "rename", click: rename, icon: "rotate11"},
            {text: "delete", click: del, icon: "close47"}
        ]);

        return (
            <ButtonMenu ref="menu" center large text={current}
                items={buttons}/>
        );
    }
});

var HeaderBar = React.createClass({
    getInitialState: function() {
        return {
            userIcon: 'user157'
        };
    },
    setFunUserIcon: function() {
        if (!this.props.user) {
            this.setState({userIcon: 'user157'});
            return;
        }

        var total = 0;
        for (var i = 0; i < this.props.user.length; i++) {
            total += this.props.user.charCodeAt(i);
        }
        var date = new Date();
        var timevar = date.getYear() + date.getMonth() +
            date.getDate()  + date.getHours();
        total = (total * 5798993) % 8879293;
        total = (total * timevar) % SKG.fun.length;
        this.setState({userIcon: 'fun/' + SKG.fun[total]});
    },
    trim: function(str) {
        if (str.indexOf('@') >=0)
            return str.substring(0, str.indexOf('@'));
        return str;
    },
    componentDidUpdate: function(prevProps) {
        if (this.props.user != prevProps.user) {
            this.setFunUserIcon();
        }
    },
    componentDidMount: function() {
        this.setFunUserIcon();
    },
    render: function() {
        var that = this;
        var button = null;
        if (this.props.user) {
            var text = this.trim(this.props.user);
            button = function() {
                return (
                    <Button mid text={text} link="/logout"
                        icon={that.state.userIcon} addClass="login-button"/>
                );
            }();
        } else {
            var text = "login";
            var items = [
                {text: "just login", link: "/login", icon: "person325"},
                {text: "copy to user", click: that.props.onProjectExport,
                 icon: "upload119"}
            ];
            button = function() {
                return (
                    <ButtonMenu mid right text="login" items={items}
                        icon={that.state.userIcon} addClass="login-button" />
                );
            }();
        }
        return (
            <div className="header-bar">
                <span className="product title">brpy</span>
                {button}
            </div>
        );
    }
});

var Worksheet = React.createClass({
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
            isDialogOpen: false,
            user: null
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
                            .i(SKG_SOLUTION_CURRENT_PROJECT, 0).o(),
                        null, fail);
                },
                fail
            );
        };
        this.openBinaryDialog("Delete project?", ok);
    },
    onProjectExport: function(proj) {
        var that = this;
        var blocks = this.state.blocks;
        var blockContent = this.state.blockContent;
        var srcTexts = this.state.srcTexts;
        var projData = blocks.map(function(block) {
            var bc = SKG.util.softCopy(blockContent[block]);
            bc["name"] = block;
            return bc;
        });
        var files = [];
        blocks.forEach(function(block) {
            blockContent[block][SKG_BLOCK_SRC].forEach(function(file) {
                var fileName = file[SKG_FILE_NAME];
                files.push(
                    {"name": fileName,
                     "text": srcTexts[fileName]}
                );
            });
        });
        var proj = {
            "name": proj + '-' + SKG.util.makeId(7).toLowerCase(),
            "json": projData,
            "files": files
        };
        // Will redirect to login.
        var done = function(v) {
            window.location.href = "/login?tid=" + v;
        }
        SKG.exportProject(proj, done);
    },
    onProjectImport: function(text) {
        var proj = JSON.parse(text);
        var projName = proj['name'];
        var projJson = proj['json'];
        var files = proj['files'];
        var that = this;

        var onSolutionRead = function(text) {
            var sol = JSON.parse(text);
            sol.projects.push(projName);
            sol.currentProject = sol.projects.length -1;
            that.updateSolution(
                SKG.d(SKG_SOLUTION_CURRENT_PROJECT, sol.currentProject)
                    .i(SKG_SOLUTION_PROJECTS, sol.projects).o());
        };

        var onWriteProjectDone = function() {
            var writeFile = function(i) {
                if (i == files.length) {
                    SKG.readSolution(onSolutionRead);
                    return;
                }

                var next = writeFile.bind(that, i + 1);
                SKG.writeSrcFile(projName, files[i].name, files[i].text,
                                 next, next);
            };
            writeFile(0);
        };
        var onNewProjectDone = function() {
            // TODO
            // There's a bug here because a new default source file is generated
            // on every new project.  It needs to be deleted.
            SKG.writeProject(projName, projJson, onWriteProjectDone);
        };

        SKG.newProject(projName, onNewProjectDone);
    },
    onImportBlock: function(aProj, bProj) {
        var that = this;
        this.openWorkingDialog();

        var onLoadProject = function(text) {
            var bBlocks = JSON.parse(text);

            var rand = SKG.util.makeId(5).toLowerCase();
            var genFileName = function(fnameExt) {
                var fileName = SKG.util.getFileName(fnameExt);
                var fileExt = SKG.util.getFileExt(fnameExt);
                return fileName + '-' + rand + '.' + fileExt;
            };

            var onOk = function(ind) {
                var bBlock = bBlocks[ind];
                var aSrcTexts = SKG.util.softCopy(that.state.srcTexts);
                var aBlockName = bBlock.name + '-' + rand;
                var bFiles = bBlock[SKG_BLOCK_SRC].map(function(file) {
                    return file[SKG_FILE_NAME];
                });

                var aBlocks = SKG.util.softCopy(that.state.blocks);
                aBlocks.unshift(aBlockName);

                var aBlock = SKG.util.deepCopy(bBlock);
                var aBlockSrcs = [];
                bBlock[SKG_BLOCK_SRC].forEach(function(file) {
                    var nfile = SKG.util.softCopy(file);
                    var fileNameExt = nfile[SKG_FILE_NAME];
                    var fileExt = SKG.util.getFileExt(fileNameExt);
                    if (fileExt == 'bk') return;
                    nfile[SKG_FILE_NAME] = genFileName(fileNameExt);
                    aBlockSrcs.push(nfile);
                });
                aBlock[SKG_BLOCK_SRC] = aBlockSrcs;
                var aBlockContent = SKG.util.softCopy(that.state.blockContent);
                aBlockContent[aBlockName] = aBlock;

                var readFile = function(i) {
                    if (i == bFiles.length) {
                        that.updateProject(
                            aProj, aBlocks, aBlockContent,
                            function () {
                                that.closeDialog();
                                that.setState({srcTexts: aSrcTexts});
                            });
                        return;
                    }
                    var bFileNameExt = bFiles[i];
                    var next = function(text) {
                        var fileExt = SKG.util.getFileExt(bFileNameExt);
                        if (fileExt == 'bk') return;
                        var aFileName = genFileName(bFileNameExt);
                        aSrcTexts[aFileName] = text;
                        SKG.writeSrcFile(
                            aProj, aFileName, text,
                            function() { readFile(i + 1); });
                    };
                    SKG.readSrcFile(bProj, bFileNameExt, next);
                };
                readFile(0);
                that.closeDialog();
            };

            var bBlockNames = bBlocks.map(function(block) {
                return block[SKG_BLOCK_NAME];
            });
            that.openChoicesDialog(bBlockNames, 'Choose a block to import:', onOk);
        };

        SKG.readProject(bProj, onLoadProject);
    },
    updateProject: function(projName, blocks, blockContent, onOk, onFail,
                            holdWrite) {
        var that = this;
        if (!blocks)
            blocks = this.state.blocks;
        if (!blockContent)
            blockContent = this.state.blockContent;

        var outerOk = function() {
            that.setState(
                SKG.d("blocks", blocks)
                    .i("blockContent", blockContent).o());
            if (onOk) {
                onOk();
            }
        };
        var projData = blocks.map(function(block) {
            var bc = SKG.util.softCopy(blockContent[block]);
            bc["name"] = block;
            return bc;
        });
        if (!holdWrite) {
            SKG.writeProject(projName, projData, outerOk, onFail);
        } else {
            outerOk();
        }
    },
    replaceInFile: function(block, fileName, data, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        var files = content[SKG_BLOCK_SRC];
        var nfile = null;
        var nfiles = files.map(function(file) {
            if (file[SKG_FILE_NAME] == fileName) {
                nfile = SKG.util.copyAndReplace(SKG_SOFT_COPY, file, data);
                return nfile;
            }
            return file;
        });
        if (!nfile) return blockContent;

        var newContent = SKG.util.copyAndReplace(
            SKG_SOFT_COPY, content, SKG.d(SKG_BLOCK_SRC, nfiles).o());
        return SKG.util.copyAndReplace(
            SKG_SOFT_COPY, blockContent, SKG.d(block, newContent).o());
    },
    getInFile: function(block, fileName, field, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        var files = content[SKG_BLOCK_SRC];
        var nfileVal = null;
        files.forEach(function(file) {
            if (file[SKG_FILE_NAME] == fileName) {
                nfileVal = file[field];
            }
        });
        return nfileVal;
    },
    replaceInBlock: function(block, data, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        var newContent = SKG.util.copyAndReplace(SKG_SOFT_COPY, content, data);
        return SKG.util.copyAndReplace(
            SKG_SOFT_COPY, blockContent, SKG.d(block, newContent).o());
    },
    getInBlock: function(block, field, blockContent) {
        if (!blockContent)
            blockContent = this.state.blockContent;
        var content = blockContent[block];
        return content[field];
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
    onFileClick: function(proj, block, infile) {
        var ind = -1;
        this.state.blockContent[block][SKG_BLOCK_SRC].forEach(
            function(fileData, ii) {
                if (fileData[SKG_FILE_NAME] == infile)
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
        var blockContent = SKG.util.deepCopy(this.state.blockContent);
        var srcTexts = SKG.util.deepCopy(this.state.srcTexts);
        var contentPaneDoms = this.state.contentPaneDoms;
        blockContent[block][SKG_BLOCK_SRC].forEach(function(file) {
            var fileName = file[SKG_FILE_NAME];
            if (srcTexts[fileName])
                delete srcTexts[fileName];
        });

        var that = this;
        blocks.forEach(function(block) {
            var nfiles = [];
            blockContent[block][SKG_BLOCK_SRC].forEach(function(file) {
                var fileName = file[SKG_FILE_NAME];
                var ext = SKG.util.getFileExt(fileName);
                var name = SKG.util.getFileName(fileName);
                if (ext == 'bk' && name == block)
                    return;
                nfiles.push(file);
            });
            blockContent = that.replaceInBlock(
                block, SKG.d(SKG_BLOCK_SRC, nfiles).o(), blockContent);
        });

        delete blockContent[block];
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

        this.updateProject(proj, blocks, blockContent, onOkInner, onFail);
    },
    onFileDelete: function(proj, block, fname) {
        var that = this;
        var failed = function() {
            that.openPromptDialog("Failed to delete file");
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

            var nfiles =
                SKG.util.deepCopy(
                    that.state.blockContent[block][SKG_BLOCK_SRC]);
            nfiles.splice(ind, 1);

            var successProj = function() {
                if (SKG.util.getFileExt(fname) == 'bk')
                    that.runProg(block);
                that.closeDialog();
            };

            var successFile = function() {
                var blockContent = that.replaceInBlock(
                    block, SKG.d(SKG_BLOCK_SRC, nfiles)
                        .i(SKG_BLOCK_CURRENT_FILE, 0).o());
                that.updateProject(
                    proj, null, blockContent, successProj, failed);

                var texts = SKG.util.softCopy(that.state.srcTexts);
                delete texts[fname];
                that.setState({ srcTexts: texts });
            };

            if (nfiles.length == 0) {
                successFile = function() {
                    that.deleteBlock(proj, block, that.closeDialog, failed);
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
            SKG.d(SKG_BLOCK_SRC, nfiles)
                .i(SKG_BLOCK_CURRENT_FILE, target).o());
        this.updateProject(
            proj, null, blockContent,
            null,
            function(){
                that.openPromptDialog("Failed to change file order"); });
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
                .d(SKG_BLOCK_SRC, [])
                .i(SKG_BLOCK_CURRENT_FILE, -1)
                .i(SKG_BLOCK_COLLAPSED, false).o();

            var doms = that.state.contentPaneDoms;
            doms[newBlock] = [];
            that.setState({contentPaneDoms: doms});

            that.updateProject(
                proj, blocks, blockContent,
                function() {
                    that.onFileMoveToBlock(proj, oldBlock, newBlock, fileExt)},
                function() {
                    that.openPromptDialog("Failed to add new block")});
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
        blockContent = this.replaceInBlock(
            newBlock,
            SKG.d(SKG_BLOCK_SRC, newBlockFiles)
                .i(SKG_BLOCK_CURRENT_FILE, newBlockFiles.length - 1).o(),
            blockContent);
        if (oldBlockFiles.length > 0) {
            blockContent = this.replaceInBlock(
                oldBlock,
                SKG.d(SKG_BLOCK_SRC, oldBlockFiles)
                    .i(SKG_BLOCK_CURRENT_FILE, 0).o(),
                blockContent);
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
            function() { that.openPromptDialog("Failed to move block"); });
    },
    onFileSetHeight: function(proj, block, file, height, update) {
        var oldHeight = this.getInFile(block, file, SKG_FILE_HEIGHT);
        if (height == null || oldHeight == height)
            return;

        var blockContent = this.replaceInFile(
            block, file, SKG.d(SKG_FILE_HEIGHT, height).o());
        this.updateProject(proj, null, blockContent, null, null, !update);
    },
    onFileOffsetY: function(proj, block, file, offsetY) {
        var oldOffsetY = this.getInFile(block, file, SKG_FILE_OFFSET_Y);
        if (offsetY !== null && oldOffsetY != offsetY) {
            var blockContent =
                this.replaceInFile(
                    block, file, SKG.d(SKG_FILE_OFFSET_Y, offsetY).o());
            this.updateProject(proj, null, blockContent);
        }
    },
    onBlockCollapse: function(proj, block, collapsed) {
        var oldCollapsed = this.getInBlock(block, SKG_BLOCK_COLLAPSED);
        if (oldCollapsed != collapsed) {
            var blockContent = this.replaceInBlock(
                block, SKG.d(SKG_BLOCK_COLLAPSED, collapsed).o());
            this.updateProject(proj, null, blockContent, null, null);
        }
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
            this.state.blockContent[block][SKG_BLOCK_SRC]);
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
            function() { that.openPromptDialog("Failed to add block link"); });
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
            var blockContent = SKG.util.softCopy(that.state.blockContent);
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
                function() {
                    that.openPromptDialog("Failed to rename block."); });
        };
        this.openTextDialog(oldBlock, "Rename block?", ok);
    },
    onBlockMove: function(proj, origin, target) {
        var that = this;
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var blockName = blocks[origin];
        blocks[origin] = blocks[target];
        blocks[target] = blockName;
        this.updateProject(
            proj, blocks, null, null,
            function() { that.openPromptDialog("Failed to move block.");});
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
                    var block = SKG.util.getFileName(fileName);
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
            s = s.trim();
            if (s.length == 0) return;
            that.refs.stdoutConsole.write(block, s);
        };
        Sk.configure(
            {"output": output, "debugout": output, "read": SKG.builtinRead}
        );

        var progs = this.collectSrc(block);
        try {
            Sk.importMainWithMultipleFiles(false, progs);
        } catch (e) {
            console.log("python[ERROR]> " + e.toString());
            if (e.stack)
                console.log(e.stack);
        }

        var ndoms = Sk.progdomIds().map(function(elem) { return elem.dom; });
        var contentPaneDoms = {};
        for (var i in this.state.contentPaneDoms)
            contentPaneDoms[i] = this.state.contentPaneDoms[i];
        contentPaneDoms[block] = ndoms;
        this.setState({contentPaneDoms: contentPaneDoms});
    },
    onRun: function(proj, block, file, code) {
        this.runProg(block);
    },
    clientSideSave: function(proj, block, file, code) {
        if (!file)
            return;
        this.state.srcTexts[file] = code;
    },
    onSave: function(proj, block, file, code) {
        if (!file)
            return;

        this.clientSideSave(proj, block, file, code);
        SKG.writeSrcFile(
            proj, file, code,
            function() { console.log("Successfully wrote " + file); },
            function() { console.log("Failed to write " + file); }
        );
    },
    onLoadProject: function(projectName, text) {
        var projectBlocks = JSON.parse(text);
        var blocks = [];
        var blockContent = {};
        var that = this;

        projectBlocks.forEach(function(block) {
            var blockName = block.name;
            blocks.push(blockName);
            delete block['name'];
            blockContent[blockName] = SKG.util.deepCopy(block);
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
            var files = blockContent[block][SKG_BLOCK_SRC].map(function(file) {
                return file[SKG_FILE_NAME];
            });
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
    onInit: function(code) {
        if (code == SKG_INIT_LOAD_SOLUTION) {
            SKG.readSolution(this.onLoadSolution);
        } else if (code == SKG_INIT_IMPORT_PROJECT) {
            SKG.importProject(this.onProjectImport);
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevState.currentProject != this.state.currentProject &&
            this.state.projects) {
            this.refs.stdoutConsole.onClear();
            var project = this.state.projects[this.state.currentProject];

            this.setState({
                blocks: [],
                blockContent: {},
                srcTexts: {},
                contentPaneDoms: {}
            });

            SKG.readProject(project, this.onLoadProject.bind(this, project));
        }
    },
    componentDidMount: function() {
        SKG.init(this.onInit);

        var that = this;
        var onLoad = function(userInfo) {
            if (!userInfo) return;
            var info = JSON.parse(userInfo);
            that.setState({user: info['email']});
        };
        SKG.readUserInfo(onLoad, null);
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
                var fileNames =
                    that.state.blockContent[iblock][SKG_BLOCK_SRC].map(
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
            var fileInd =
                this.state.blockContent[block][SKG_BLOCK_CURRENT_FILE];

            if (fileInd < 0 || fileInd > files.length)
                return null;
            
            var fileName = files[fileInd][SKG_FILE_NAME];
            var doms = this.state.contentPaneDoms[block];
            var fileClick = this.onFileClick.bind(this, proj, block);
            var fileRename = this.onFileRename.bind(this, proj, block);
            var fileAdd = this.onFileAdd.bind(this, proj, block);
            var fileDel = this.onFileDelete.bind(this, proj, block);
            var fileMove = this.onFileMove.bind(this, proj, block);
            var fileSetHeight =
                this.onFileSetHeight.bind(this, proj, block, fileName);
            var offsetYVal = files[fileInd][SKG_FILE_OFFSET_Y];
            var fileOffsetY = this.onFileOffsetY.bind(this, proj, block);
            var blockRename = this.onBlockRename.bind(this, proj, block);
            var blockMoveUp = null;
            var blockMoveDown = null;
            var blockCollapse = this.onBlockCollapse.bind(this, proj, block);
            var blockCollapsedVal =
                this.state.blockContent[block][SKG_BLOCK_COLLAPSED];

            var blockHeight = files[fileInd][SKG_FILE_HEIGHT];
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
                height={blockHeight} collapsed={blockCollapsedVal}
                    fileOffsetY={offsetYVal}
                    srcTexts={this.state.srcTexts} currentFileInd={fileInd}
                    contentDoms={doms} isDialogOpen={this.state.isDialogOpen}
                    onFileRename={fileRename} onFileAdd={fileAdd}
                    onFileDelete={fileDel} onFileMove={fileMove}
                    onFileClick={fileClick} onBlockRename={blockRename}
                    onBlockMoveUp={blockMoveUp} onBlockMoveDown={blockMoveDown}
                    onFileMoveToBlocks={fileMoveToBlocks}
                    onFileMoveToNewBlock={fileMoveToNewBlock}
                    onFileSetHeight={fileSetHeight}
                    onFileOffsetY={fileOffsetY}
                    onBlockCollapse={blockCollapse}
                    onBlockLinkAdds={blockLinkAdds}
                    onRun={run} onSave={save} />
            );
        }.bind(this));

        var projExport = this.onProjectExport.bind(this, proj);
        var importBlock = this.onImportBlock.bind(this, proj);

        return (
           <div className="main-panel">
                <HeaderBar user={this.state.user}
                    onProjectExport={projExport} />
                <ProjectBar projects={this.state.projects}
                    currentProject={this.state.currentProject}
                    onProjectDelete={this.onProjectDelete}
                    onProjectNew={this.onProjectNew}
                    onProjectClick={this.onProjectClick}
                    onProjectRename={this.onProjectRename}
                    onImportBlock={importBlock} />
                <StdoutConsole ref="stdoutConsole"
                    isDialogOpen={this.state.isDialogOpen}/>
                {blocks}
                <Footer />
           </div>
        );
    }
});
