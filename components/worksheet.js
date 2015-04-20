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
    timedOpen: function(waitTime) {
        if (this.hideTimeout || this.state.hidden) {
            var that = this;
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
            this.hideTimeout = setTimeout(function() {
                that.setState({ hidden: true, autoHide: false });
                that.hideTimeout = null;
            }, waitTime);
        }
    },
    info: function(block) {
        var time = new Date();
        var hours = time.getHours();
        var mins = time.getMinutes();
        var secs = time.getSeconds();
        var infoStr = block + " [" +
            ((hours < 10) ? "0" + hours : hours) + ":" +
            ((mins < 10) ? "0" + mins : mins) + ":" +
            ((secs < 10) ? "0" + secs : secs) + "] > ";
        return infoStr;
    },
    error: function(block, e) {
        this.timedOpen(8000);
        var infoStr = this.info(block);
        var content = this.state.content;
        var contentCn = "content error"
        var str = e.toString();
        content.unshift(function() {
            return (
                <div key={content.length} className="single-output">
                    <div className="info">{infoStr}</div>
                    <div className={contentCn}>
                       {str}
                    </div>
                </div>
            );
        }());

        this.setState({
            hidden: false,
            content: content});
    },
    write: function(block, s) {
        if (!s) return;

        this.timedOpen(4000);
        var infoStr = this.info(block);
        var ks = kramed(s);
        var content = this.state.content;
        var contentCn = "content ";
        contentCn += content.length % 2 == 0 ? "content-dark" : "content-light";
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

var ProjectButton = React.createClass({
    render: function(){
        if (!this.props.projects)
            return null;

        var isPublished = this.props.user == SKG_USER_PUBLISHED;
        var that = this;
        var projId = this.props.projects[this.props.currentProject];
        var current = isPublished ? this.props.projectMeta.alias : projId;
        var descText = this.props.projectMeta.desc;

        if (isPublished) {
            var buttons = [
                {'text': 'back to published', link: '/published/',
                 icon: 'back57'}
            ];
            return (
                <ButtonMenu ref="menu" center large text={current}
                    title={descText} items={buttons}/>
            );
        }

        var buttons = [];
        if (this.props.projects && this.props.projects.length > 1) {
            buttons = [{text: "other projects", hr: true}];
            buttons = buttons.concat(
                this.props.projects.map(function(proj) {
                    if (proj == projId)
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
        var rename = function() {
            return that.props.onProjectRename(projId); };
        var del = function() {
            return that.props.onProjectDelete(projId); };
        var publish = function() {
            return that.props.onProjectPublish(projId); }
        var desc = function() {
            return that.props.onProjectChangeDescription(projId); }

        if (this.props.user && this.props.user != SKG_USER_START &&
            this.props.user != SKG_USER_PUBLISHED) {
            buttons = buttons.concat([
                {text: "project options", hr: true},
                {text: "new", click: this.props.onProjectNew, icon: "add186"},
                {text: "rename", click: rename, icon: "rotate11"},
                {text: "delete", click: del, icon: "close47"},
                {text: 'change description', click: desc, icon: 'bubble8'},
                {text: "publish project", click: publish, icon: "screen47"}
            ]);
        }

        return (
            <ButtonMenu ref="menu" center large text={current} title={descText}
                addClass="project-button" items={buttons}/>
        );
    }
});

var LogoMenu =  React.createClass({
    render: function() {
        var items = [
            {text: "published", link: "/published/", icon: 'show5',
             addClass: "logo-item"},
            {text: "github", link: "https://github.com/poweif/brpy",
             icon: "github17", addClass: "logo-item"}
        ];
        return (
            <ButtonMenu mid text="brpy" addClass="logo-menu"
                items={items} icon="brpy"/>
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
        if (!this.props.loggedInUser) {
            if (this.props.user == SKG_USER_PUBLISHED) {
                this.setState({userIcon: 'emoticon117'});
                return;
            }
            this.setState({userIcon: 'user157'});
            return;
        }
        var total = 0;
        var user = this.props.loggedInUser;
        for (var i = 0; i < user.length; i++) {
            total += user.charCodeAt(i);
        }
        var date = new Date();
        var timevar = date.getYear() + date.getMonth() +
            date.getDate()  + date.getHours();
        total = (total * 5798993) % 8879293;
        total = (total * timevar) % SKG.fun.length;
        this.setState({userIcon: 'fun/' + SKG.fun[total]});
    },
    componentDidUpdate: function(prevProps) {
        if (this.props.loggedInUser != prevProps.loggedInUser ||
            this.props.user != prevProps.user) {
            this.setFunUserIcon();
        }
        if (this.props.isDialogOpen) {
            if (this.refs.rightMenu)
                this.refs.rightMenu.getDOMNode().style.zIndex = "-1";
            if (this.refs.logo)
                this.refs.logo.getDOMNode().style.zIndex = "-1";
        } else {
            if (this.refs.rightMenu)
                this.refs.rightMenu.getDOMNode().style.zIndex = "8";
            if (this.refs.logo)
                this.refs.logo.getDOMNode().style.zIndex = "8";
        }
    },
    componentDidMount: function() {
        this.setFunUserIcon();
    },
    render: function() {
        var that = this;
        var button = null;
        console.log(this.props.loggedInUser);
        if (this.props.loggedInUser) {
            var text = SKG.util.trimUserName(this.props.loggedInUser);
            var items = [
                {text: "log out", link: "/logout", icon: "back57"}
            ];
            if (this.props.loggedInUser != this.props.user) {
                if (that.props.onProjectExport) {
                    items.unshift(
                        {text: "copy to workspace", click: this.props.onProjectExport,
                         icon: "upload119"}
                    );
                }

                items.unshift(
                    {text: "go to workspace", link: "/", icon: "forward18"}
                );
            }

            button = function() {
                return (
                    <ButtonMenu mid right text={text}
                        icon={that.state.userIcon}
                        items={items} addClass="login-button"/>
                );
            }();
        } else {
            if (that.props.onProjectExport) {
                var items = [
                    {text: "copy to user", click: this.props.onProjectExport,
                     icon: "upload119"}
                ];
                var userText = "log in";
                if (this.props.loggedInUser) {
                    items.unshift(
                        {text: "go to workspace", link: "/", icon: "forward18"}
                    );
                    userText = SKG.util.trimUserName(this.props.loggedInUser);
                } else {
                    items.unshift(
                        {text: "just log in", link: "/login", icon: "forward18"}
                    );
                }

                button = function() {
                    return (
                        <ButtonMenu mid right text={userText} items={items}
                            icon={that.state.userIcon} />
                    );
                }();
            } else {
                button = function() {
                    return (
                        <Button mid text="log in" icon={that.state.userIcon}
                            link="/login" />
                    );
                }();
            }
        }
        var rightMost = function() {
            var solutionOptions = null;
            if (that.props.onEditorModeChange) {
                var editorItems = SKG_EDITORS.map(function(editor) {
                    var selected = that.props.selectedEditorMode;
                    var addClass = selected == editor ? 'selected-editor' : null;
                    var icon = selected == editor ? 'filled13' : 'circle107';
                    var click = function() {
                        that.props.onEditorModeChange(editor);
                    };
                    return {text: editor, addClass: addClass, click: click,
                            icon: icon};
                });
                editorItems.unshift({hr: true, text: 'input modes'});
                solutionOptions = function() {
                    return (
                        <ButtonMenu mid right addClass="menu-button"
                            items={editorItems} icon="menu55" />
                    );
                }();
            }
            return (
                <div ref="rightMenu" className="right-menus">
                    {solutionOptions}
                    {button}
                </div>
            );
        }();

        return (
            <div className="header-bar">
                <LogoMenu ref="logo" />
                {rightMost}
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
            // project data
            blocks: [],
            blockContent: {},
            srcTexts: {},
            contentPaneDoms: {},
            projectMeta: {},
            // solution data
            projects: [],
            currentProject: -1,
            editorMode: SKG_EDITOR_STANDARD,
            // other meta
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
        SKG.updateSolution(this.props.user, solData, outerOk, onFail);
    },
    onEditorModeChange: function(mode) {
        this.updateSolution(
            SKG.d(SKG_SOLUTION_EDITOR_MODE, mode).o());
    },
    onProjectRename: function(oldProj) {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to change project name");
        };
        var ok = function(newProj) {
            that.openWorkingDialog();
            var onSolutionDone = function() {
                SKG.updateWithUserProject(that.props.user, newProj);
            };
            SKG.renameProject(
                that.props.user,
                oldProj,
                newProj,
                function() {
                    that.closeDialog();
                    var projs = that.state.projects.map(function(p) {
                        return p == oldProj ? newProj : p;
                    });
                    that.updateSolution(
                        SKG.d(SKG_SOLUTION_PROJECTS, projs).o(),
                        onSolutionDone, fail);
                },
                fail
            );
        };
        this.openTextDialog(oldProj, "Rename project?", null, ok);
    },
    onProjectClick: function(project) {
        // working dialog will be closed when project has finished loading
        // (onLoadProject).
        this.openWorkingDialog();

        this.updateSolution(
            SKG.d(SKG_SOLUTION_CURRENT_PROJECT,
                  SKG.util.indexOf(this.state.projects, project)).o());
    },
    onProjectNew: function() {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to create new project.");
        };
        var ok = function(text) {
            that.openWorkingDialog();
            SKG.newProject(
                that.props.user,
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
        this.openTextDialog("new-project", "New project name?", null, ok);
    },
    onProjectPublish: function(projName) {
        var that = this;

        var ok = function() {
            that.openWorkingDialog();
            var doneAll = function() {
                that.closeDialog();
            };

            var onReceivedKey = function(key) {
                var donePublish = function() {
                    SKG.donePublish(that.props.user, key, doneAll, doneAll);
                };
                var updateState = false;
                var projPackage = that.packageProject(projName, key);
                that.writeProjectFromPackage(
                    SKG_USER_PUBLISHER, projPackage, updateState, donePublish,
                    doneAll);
            };
            SKG.requestPublish(that.props.user, onReceivedKey);
        }
        this.openBinaryDialog("Really publish project?", ok);
    },
    onProjectChangeDescription: function(projName) {
        var desc = this.state.projectMeta['desc'];
        var that = this;
        if (!desc) desc = 'enter a description';
        var options = {
            'multiline': true,
            'maxLength': 139,
            'allowAll': true
        };
        var onDone = function() {
            that.closeDialog();
        };
        var ok = function(text) {
            var projectMeta = that.state.projectMeta;
            projectMeta['desc'] = text;

            that.updateProject(projName, null, null, projectMeta, onDone);
        };
        this.openTextDialog(desc, "Change Project Description?", options, ok);
    },
    onProjectDelete: function(proj) {
        var that = this;
        var fail = function() {
            that.openPromptDialog("Failed to delete project");
        };
        var ok = function() {
            that.openWorkingDialog();
            SKG.deleteProject(
                that.props.user,
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
    packageProject: function(projName, id) {
        var blocks = this.state.blocks;
        var blockContent = this.state.blockContent;
        var srcTexts = this.state.srcTexts;
        var projData = SKG.util.softCopy(this.state.projectMeta);
        projData['blocks'] = blocks.map(function(block) {
            var bc = SKG.util.softCopy(blockContent[block]);
            bc["name"] = block;
            return bc;
        });
        if (id) {
            projData['alias'] = projName;
            if (this.props.user)
                projData['publisher'] = this.props.user;
            var date = new Date();
            var hour = date.getHours() < 10 ? "0" + date.getHours() :
                "" + date.getHours();
            var min = date.getMinutes() < 10 ? "0" + date.getMinutes() :
                "" + date.getMinutes();

            projData['publishedTime'] =
                '' + date.getFullYear() + '-' + date.getMonth() + '-' +
                date.getDate() + '@' + hour + ':' + min;
        }
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

        // if id is true. The name of the project is the given id,
        // and the alias is the human-readable title.
        var newProjName = projName;
        if (!id)
            newProjName += '-' + SKG.util.makeId(7).toLowerCase();
        else {
            newProjName = id;
        }

        var ret = {
            "name": newProjName,
            "json": projData,
            "files": files
        };

        return ret;
    },
    onProjectExport: function(projName) {
        var projPackage = this.packageProject(projName);
        // Will redirect to login.
        var done = function(v) {
            window.location.href = "/login?tid=" + v;
        }
        SKG.exportProject(projPackage, done);
    },
    writeProjectFromPackage: function(
        destUser, proj, updateState, onOk, onFail) {
        // Unpackaging
        var projName = proj['name'];
        var projJson = proj['json'];
        var files = proj['files'];
        var that = this;

        var onSolutionRead = function(text) {
            var sol = JSON.parse(text);
            sol.projects.push(projName);
            sol.currentProject = sol.projects.length - 1;
            var solData =
                SKG.d(SKG_SOLUTION_CURRENT_PROJECT, sol.currentProject)
                    .i(SKG_SOLUTION_PROJECTS, sol.projects)
                    .i(SKG_SOLUTION_EDITOR_MODE, sol.editorMode).o();

            var outerOk = function() {
                if (updateState) that.setState(solData);
                if (onOk) onOk();
            };
            SKG.updateSolution(destUser, solData, outerOk, onFail);
        };

        var onWriteProjectDone = function() {
            var writeFile = function(i) {
                if (i == files.length) {
                    SKG.readSolution(destUser, onSolutionRead, onFail);
                    return;
                }

                var next = writeFile.bind(that, i + 1);
                SKG.writeSrcFile(
                    destUser, projName, files[i].name, files[i].text, next,
                    next);
            };
            writeFile(0);
        };
        var onNewProjectDone = function() {
            // TODO
            // There's a bug here because a new default source file is generated
            // on every new project.  It needs to be deleted.
            SKG.writeProject(
                destUser, projName, projJson, onWriteProjectDone, onFail);
        };
        SKG.newProject(destUser, projName, onNewProjectDone, onFail);
    },
    onProjectImport: function(text) {
        var that = this;
        this.openWorkingDialog();
        var projPackage = JSON.parse(text);
        var onDone = function() {}
        this.writeProjectFromPackage(
            this.props.user, projPackage, true, onDone, onDone);
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
                    if (fileExt == SKG_FILE_EXT_BK) return;
                    nfile[SKG_FILE_NAME] = genFileName(fileNameExt);
                    aBlockSrcs.push(nfile);
                });
                aBlock[SKG_BLOCK_SRC] = aBlockSrcs;
                var aBlockContent = SKG.util.softCopy(that.state.blockContent);
                aBlockContent[aBlockName] = aBlock;

                var readFile = function(i) {
                    if (i == bFiles.length) {
                        that.updateProject(
                            aProj, aBlocks, aBlockContent, null,
                            function () {
                                that.closeDialog();
                                that.setState({srcTexts: aSrcTexts});
                            });
                        return;
                    }
                    var bFileNameExt = bFiles[i];
                    var fileExt = SKG.util.getFileExt(bFileNameExt);
                    var next = function(text) {
                        if (fileExt == SKG_FILE_EXT_BK) {
                            readFile(i + 1);
                            return;
                        }
                        var aFileName = genFileName(bFileNameExt);
                        aSrcTexts[aFileName] = text;
                        SKG.writeSrcFile(
                            that.props.user, aProj, aFileName, text,
                            function() { readFile(i + 1); });
                    };
                    if (fileExt != SKG_FILE_EXT_BK)
                        SKG.readSrcFile(
                            that.props.user, bProj, bFileNameExt, next);
                    else
                        next();
                };
                readFile(0);
                that.closeDialog();
            };

            var bBlockNames = bBlocks.map(function(block) {
                return block[SKG_BLOCK_NAME];
            });
            that.openChoicesDialog(bBlockNames, 'Choose a block to import:', onOk);
        };

        SKG.readProject(that.props.user, bProj, onLoadProject);
    },
    updateProject: function(projName, blocks, blockContent, projectMeta, onOk,
                            onFail, holdWrite) {
        var that = this;
        if (!blocks)
            blocks = this.state.blocks;
        if (!blockContent)
            blockContent = this.state.blockContent;
        if (!projectMeta)
            projectMeta = this.state.projectMeta;

        var outerOk = function() {
            that.setState(
                SKG.d("blocks", blocks)
                    .i("blockContent", blockContent).o());
            if (onOk) {
                onOk();
            }
        };
        var projData = SKG.util.softCopy(projectMeta);
        projData['blocks'] = blocks.map(function(block) {
            var bc = SKG.util.softCopy(blockContent[block]);
            bc["name"] = block;
            return bc;
        });
        if (!holdWrite) {
            SKG.writeProject(that.props.user, projName, projData, outerOk,
                             onFail);
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
                    proj, null, blockContent, null,
                    function() { that.setState({srcTexts: srcTexts}); },
                    failed
                );
            };

            SKG.renameSrcFile(
                that.props.user, proj, oldFileExt, newFileExt, successFile,
                failed);
        };
        this.openTextDialog(file, "New file name?", null, ok);
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
            this.updateProject(proj, null, blockContent, null);
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
                    proj, null, blockContent, null,
                    function() { that.setState({srcTexts: srcTexts}); },
                    failed);
            };
            SKG.writeSrcFile(
                that.props.user, proj, fnameExt, fileSrc, successFile, failed);
        };
        this.openTextDialog("new", "New file?", null, ok);
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
                if (ext == SKG_FILE_EXT_BK && name == block)
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

        this.updateProject(proj, blocks, blockContent, null, onOkInner, onFail);
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
                if (SKG.util.getFileExt(fname) == SKG_FILE_EXT_BK)
                    that.runProg(block);
                that.closeDialog();
            };

            var successFile = function() {
                var blockContent = that.replaceInBlock(
                    block, SKG.d(SKG_BLOCK_SRC, nfiles)
                        .i(SKG_BLOCK_CURRENT_FILE, 0).o());
                that.updateProject(
                    proj, null, blockContent, null, successProj, failed);

                var texts = SKG.util.softCopy(that.state.srcTexts);
                delete texts[fname];
                that.setState({ srcTexts: texts });
            };

            if (nfiles.length == 0) {
                successFile = function() {
                    that.deleteBlock(proj, block, that.closeDialog, failed);
                };
            }

            SKG.deleteSrcFile(
                that.props.user, proj, fname, successFile, failed);
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
            proj, null, blockContent, null,
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
                .i(SKG_BLOCK_DISPLAY, false)
                .i(SKG_BLOCK_COLLAPSED, false).o();

            var doms = that.state.contentPaneDoms;
            doms[newBlock] = [];
            that.setState({contentPaneDoms: doms});

            that.updateProject(
                proj, blocks, blockContent, null,
                function() {
                    that.onFileMoveToBlock(proj, oldBlock, newBlock, fileExt)},
                function() {
                    that.openPromptDialog("Failed to add new block")});
        };
        this.openTextDialog(file, "New Block?", null, ok);
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
            proj, blocks, blockContent, null,
            onOk,
            function() { that.openPromptDialog("Failed to move block"); });
    },
    onFileSetHeight: function(proj, block, file, height, update) {
        var oldHeight = this.getInFile(block, file, SKG_FILE_HEIGHT);
        if (height == null || oldHeight == height)
            return;

        var blockContent = this.replaceInFile(
            block, file, SKG.d(SKG_FILE_HEIGHT, height).o());
        this.updateProject(proj, null, blockContent, null, null, null, !update);
    },
    onFileOffsetY: function(proj, block, file, offsetY) {
        var oldOffsetY = this.getInFile(block, file, SKG_FILE_OFFSET_Y);
        if (offsetY !== null && oldOffsetY != offsetY) {
            var blockContent =
                this.replaceInFile(
                    block, file, SKG.d(SKG_FILE_OFFSET_Y, offsetY).o());
            this.updateProject(proj, null, blockContent, null);
        }
    },
    onBlockCollapse: function(proj, block, collapsed) {
        var oldCollapsed = this.getInBlock(block, SKG_BLOCK_COLLAPSED);
        if (oldCollapsed != collapsed) {
            var blockContent = this.replaceInBlock(
                block, SKG.d(SKG_BLOCK_COLLAPSED, collapsed).o());
            this.updateProject(proj, null, blockContent, null);
        }
    },
    onBlockDisplay: function(proj, block, display) {
        var oldDisplay = this.getInBlock(block, SKG_BLOCK_DISPLAY);
        if (oldDisplay != display) {
            var blockContent = this.replaceInBlock(
                block, SKG.d(SKG_BLOCK_DISPLAY, display).o());
            this.updateProject(proj, null, blockContent, null);
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
            if (ext == SKG_FILE_EXT_BK)
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
            proj, null, blockContent, null,
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
                        if (ext == SKG_FILE_EXT_BK && name == oldBlock) {
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
                proj, blocks, blockContent, null,
                blockOk,
                function() {
                    that.openPromptDialog("Failed to rename block."); });
        };
        this.openTextDialog(oldBlock, "Rename block?", null, ok);
    },
    onBlockMove: function(proj, origin, target) {
        var that = this;
        var blocks = SKG.util.deepCopy(this.state.blocks);
        var blockName = blocks[origin];
        blocks[origin] = blocks[target];
        blocks[target] = blockName;
        this.updateProject(
            proj, blocks, null, null,
            null,
            function() { that.openPromptDialog("Failed to move block.");});
    },
    collectSrc: function(block) {
        var that = this;
        var ret = [];
        this.state.blockContent[block][SKG_BLOCK_SRC].forEach(
            function(file) {
                var fileName = file[SKG_FILE_NAME];
                var ext = SKG.util.getFileExt(fileName);
                if (ext == SKG_FILE_EXT_PY) {
                    ret.push(
                        { name: fileName,
                          body: that.state.srcTexts[fileName] });
                } else if (ext == SKG_FILE_EXT_BK) {
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
            if (SKG.util.getFileExt(fileName) == SKG_FILE_EXT_BK)
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
            that.refs.stdoutConsole.error(block, e);
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

        var that = this;
        this.clientSideSave(proj, block, file, code);
        SKG.writeSrcFile(
            that.props.user, proj, file, code,
            function() { console.log("Successfully wrote " + file); },
            function() { console.log("Failed to write " + file); }
        );
    },
    onLoadProject: function(projectName, text, onAllDone) {
        // To distinguish between old style and new style.
        var blob = JSON.parse(text);
        var projectBlocks = null;
        var projectMeta = {};
        if (blob.length == undefined) {
            projectBlocks = blob['blocks'];
            delete blob['blocks'];
            projectMeta = blob;
        } else {
            projectBlocks = JSON.parse(text);
        }

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
            if (SKG.util.getFileExt(file) == SKG_FILE_EXT_BK)
                return onDoneFile();
            SKG.readSrcFile(
                that.props.user, projectName, file,
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
            if (onAllDone)
                onAllDone();
        };
        runq(SKG.util.deepCopy(blocks), readBlock, allDone);

        that.setState({
            projectName: projectName,
            blocks: blocks,
            blockContent: blockContent,
            projectMeta: projectMeta
        });
    },
    onLoadSource: function(file, text) {
        var content = SKG.util.deepCopy(this.state.srcTexts);
        content[file] = text;
        this.setState({srcTexts: content});
    },
    onLoadSolution: function(text) {
        var that = this;
        var solution = JSON.parse(text);
        if (!solution.editorMode)
            solution.editorMode = SKG_EDITOR_STANDARD;

        var projInd = SKG.util.indexOf(
            solution.projects, SKG.readProjectFromURL());

        if (projInd < 0) {
            this.closeDialog();
            this.setState(
                SKG.d(SKG_SOLUTION_PROJECTS, solution.projects)
                    .i(SKG_SOLUTION_CURRENT_PROJECT, solution.currentProject)
                    .i(SKG_SOLUTION_EDITOR_MODE, solution.editorMode)
                    .o());
        } else {
            this.setState(
                SKG.d(SKG_SOLUTION_PROJECTS, solution.projects)
                    .i(SKG_SOLUTION_EDITOR_MODE, solution.editorMode)
                    .o());

            // set a little timeout to ensure good state
            setTimeout(function() {
                that.updateSolution(
                    SKG.d(SKG_SOLUTION_CURRENT_PROJECT, projInd).o());
            }, 500);
        }
    },
    onInit: function(code) {
        if (code == SKG_INIT_LOAD_SOLUTION) {
            this.openWorkingDialog();
            SKG.readSolution(this.props.user, this.onLoadSolution);
        } else if (code == SKG_INIT_IMPORT_PROJECT) {
            SKG.importProject(this.props.user, this.onProjectImport);
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        if (this.props.user != prevProps.user && this.props.user) {
            SKG.init(this.props.user, this.onInit);
        }

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
            var loadProject = function(text) {
                that.onLoadProject(project, text, that.closeDialog);
                SKG.updateWithUserProject(that.props.user, project);
            };
            this.openWorkingDialog();
            SKG.readProject(that.props.user, project, loadProject);
        }
    },
    componentDidMount: function() {
        if (this.props.user)
            SKG.init(this.props.user, this.onInit);
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
            var blockDisplayF = this.onBlockDisplay.bind(this, proj, block, false);
            var blockDisplayT = this.onBlockDisplay.bind(this, proj, block, true);
            var blockDisplayVal =
                this.state.blockContent[block][SKG_BLOCK_DISPLAY];

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

            if (blockDisplayVal) {
                return (
                    <DisplayBlock onBlockDisplay={blockDisplayF}
                        contentDoms={doms} name={block} />
                );
            }

            return (
                <WorksheetBlock key={index} files={files} name={block}
                    height={blockHeight} collapsed={blockCollapsedVal}
                    display={blockDisplayVal} editorMode={this.state.editorMode}
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
                    onBlockDisplay={blockDisplayT}
                    onRun={run} onSave={save} />
            );
        }.bind(this));

        var projExport = this.onProjectExport.bind(this, proj);
        var importBlock = this.onImportBlock.bind(this, proj);

        var isPublished = this.props.user == SKG_USER_PUBLISHED;
        var datePublisher = null;
        if (isPublished && this.state.projectMeta.publisher &&
            this.state.projectMeta.publishedTime) {
            var warning = "This is published project. Changes made here cannot be saved. Please copy to your own workspace if you'd like to continue the work here."
            datePublisher = function() {
                return (
                    <div className="subtext">
                        <span>Published by
                            <span className="highlight">
                                {that.state.projectMeta.publisher}
                            </span>
                            on
                            <span className="highlight">
                                {that.state.projectMeta.publishedTime}
                            </span>
                       </span>
                       <span className="warning">{warning}</span>
                    </div>
                );
            }();
        }

        console.log(this.props.loggedInUser);

        return (
           <div className="main-panel">
                <HeaderBar user={this.props.user}
                    loggedInUser={this.props.loggedInUser}
                    onProjectExport={projExport}
                    isDialogOpen={this.state.isDialogOpen}
                    onEditorModeChange={this.onEditorModeChange}
                    selectedEditorMode={this.state.editorMode} />
                <span className="project-title">
                    <ProjectButton
                        projects={this.state.projects}
                        onProjectDelete={this.onProjectDelete}
                        onProjectNew={this.onProjectNew}
                        onProjectPublish={this.onProjectPublish}
                        onProjectChangeDescription=
                            {this.onProjectChangeDescription}
                        onProjectClick={this.onProjectClick}
                        onProjectRename={this.onProjectRename}
                        currentProject={this.state.currentProject}
                        onImportBlock={importBlock}
                        projectMeta={this.state.projectMeta}
                        loggeInUser={this.props.loggedInUser}
                        user={this.props.user} />
                    {datePublisher}
                </span>
                <StdoutConsole ref="stdoutConsole"
                    isDialogOpen={this.state.isDialogOpen} />
                {blocks}
           </div>
        );
    }
});
