var ContentPane = React.createClass({
    height: 0,
    mountContentDoms: function() {
        if (!this.props.contentDoms || this.props.contentDoms.length == 0)
            return;

        var wrapper = this.refs.main.getDOMNode();
        while(wrapper.hasChildNodes()) {
            wrapper.removeChild(wrapper.firstChild);
        }
        this.height = 0;
        var that = this;
        this.props.contentDoms.forEach(function(elem) {
            wrapper.appendChild(elem);
            that.height += SKG.util.fullElementHeight(elem);
        });
        this.height += 20;
        this.height += 30 * (this.props.contentDoms.length);
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevProps.contentDoms !== this.props.contentDoms)
            this.mountContentDoms();
    },
    componentDidMount: function() {
        this.mountContentDoms();
    },
    maxHeight: function() {
        //        return SKG.util.fullElementHeight(this.refs.main.getDOMNode());
        //        console.log(this.height);
        return this.height;
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
                    {text: "rename", icon: "snake4", click: renameFunc} :
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
        if (this.refs.blockLink)
            totalHeight += this.refs.blockLink.maxHeight();
        return totalHeight;
    },
    componentWillReceiveProps: function(nextProps) {
        if (this.props.currentFileInd != nextProps.currentFileInd &&
            this.refs.editor) {
            this.refs.editor.save();
            this.refs.editor.changeOffsetY();
        }
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

        var onFileOffsetY = function(offsetY) {
            that.props.onFileOffsetY(fileName, offsetY);
        };

        var editorPaneCn = "editor-pane";

        if (!this.props.highlightable)
            editorPaneCn += " unselectable";

        var realHeight = Math.max(0, this.props.height - this.fileRowHeight());

        var sourceEditor = src ? function() {
            return (
                <SourceEditor ref="editor" src={src}
                    offsetY={that.props.fileOffsetY}
                    onOffsetY={onFileOffsetY}
                    height={realHeight} resize={that.props.resize}
                    onRun={run} onSave={save} />
            );
        }() : null;
        if (SKG.util.getFileExt(fileName) == 'bk') {
            sourceEditor = function() {
                return (
                    <BlockLinkPane ref="blockLink" resize={that.props.resize}
                        block={fileName} />
                );
            }();
        }

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

var DisplayBlock = React.createClass({
    getInitialState: function() {
        return {
            isMouseOver: false
        };
    },
    mouseOver: function() {
        if (!this.state.isMouseOver)
            this.setState({isMouseOver: true});
    },
    mouseLeave: function() {
        if (this.state.isMouseOver) {
            this.setState({isMouseOver: false});
        }
    },
    render: function() {

        if (!this.props.contentDoms || this.props.contentDoms.length == 0) {
            var separatorCn = 'separator';
            var minText = this.props.name;
            var minIcon = 'create3';
            if (!this.state.isMouseOver) {
                separatorCn += ' mouse-out-fade';
                minText = '.......'
                minIcon = null;
            }

            return (
                <div className={separatorCn} onMouseOver={this.mouseOver}
                    onMouseLeave={this.mouseLeave} >
                    <Button text={minText} icon={minIcon}
                        click={this.props.onBlockDisplay} />
                </div>
            );
        }

        var separatorCn = 'separator';
        if (!this.state.isMouseOver) {
            separatorCn += ' mouse-out-clear';
        }

        return (
            <div className='display-block' onMouseOver={this.mouseOver}
                onMouseLeave={this.mouseLeave} >
                <div className={separatorCn} >
                    <div className="display-separator-line-wrapper">
                        <div className="separator-line"></div>
                    </div>
                    <span className="block-name">{this.props.name}</span>
                    <Button icon="create3" click={this.props.onBlockDisplay} />
                </div>
                <div className="block-content">
                    <ContentPane ref="contentPane"
                        contentDoms={this.props.contentDoms}
                        block={this.props.name} />
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
            editorHeight: 0
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
        var srcHeight = this.props.height;
        this.separatorDrag = function(f) {
            this.setHeight(srcHeight - (srcY - f.clientY) * (upper ? -1 : 1));
        }.bind(this);
        window.addEventListener("mousemove", this.separatorDrag);
        this.getDOMNode().classList.remove('worksheet-block-trans');
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
            this.setHeightAndUpdate(this.props.height + 1);
            this.getDOMNode().classList.add('worksheet-block-trans');
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
    minHeight: function() {
        return this.separatorHeight() + 50;
    },
    setHeight: function(height, update) {
        if (this.props.onFileSetHeight)
            this.props.onFileSetHeight(
                Math.max(this.minHeight(), Math.min(height, this.maxHeight())),
                update);
    },
    setHeightAndUpdate: function(height) {
        this.setHeight(height, true);
    },
    onContentUpdate: function() {
//        this.setHeightAndUpdate(this.props.height);
    },
    blockExpand: function() {
        if (this.props.onBlockCollapse && this.props.collapsed) {
            this.props.onBlockCollapse(false);
            return;
        }

        if (this.props.height < this.defaultHeight()) {
            this.setHeightAndUpdate(this.defaultHeight());
            return
        }
        var maxHeight = this.maxHeight();
        if (this.props.height < maxHeight)
            this.setHeightAndUpdate(maxHeight);
    },
    blockCollapse: function() {
        if (this.props.height > this.defaultHeight()) {
            this.setHeightAndUpdate(this.defaultHeight());
            return;
        }
        this.getDOMNode().style.height = null;
        if (this.props.onBlockCollapse)
            this.props.onBlockCollapse(true);
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.collapsed != prevProps.collapsed &&
            this.refs.editorPane) {
            this.refs.editorPane.forceUpdate();
        }

        if (this.props.height != prevProps.height) {
            this.getDOMNode().style.height = this.props.height + "px";
            this.setState(
                {editorHeight: this.props.height - this.separatorHeight()});
        }

        if (this.props.collapsed) {
            this.getDOMNode().style.height = null;
        }
    },
    componentDidMount: function() {
        window.addEventListener("mouseup", this.mouseUp);

        this.getDOMNode().style.height = this.props.height + "px";
        this.getDOMNode().classList.add('worksheet-block-trans');
        if (this.refs.editorPane)
            this.refs.editorPane.forceUpdate();
        this.setState(
            {editorHeight: this.props.height - this.separatorHeight()});
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
            items.push({text: "display mode", click: this.props.onBlockDisplay,
                        icon: 'blank32'});
            items.push({text: "rename", click: this.props.onBlockRename,
                        icon: "snake4"});
            return (
                <ButtonMenu right items={items} text={this.props.name} />
            );
        }.bind(this)();

        if (this.props.collapsed) {
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

        var worksheetBlockCn = "worksheet-block";
        if (this.props.isDialogOpen)
            worksheetBlockCn += "-backgrounded";

        return (
            <div className={worksheetBlockCn}>
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
                        fileOffsetY={this.props.fileOffsetY}
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
                        onFileOffsetY={this.props.onFileOffsetY}
                        onBlockLinkAdds={this.props.onBlockLinkAdds}
                        srcTexts={this.props.srcTexts}
                        files={this.props.files}
                        currentFileInd={this.props.currentFileInd} />
                </div>
                {sepLower}
            </div>
        );
    }
});
