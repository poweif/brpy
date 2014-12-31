var InputDialog = React.createClass({
    getInitialState: function() {
        return {
            text: null
        };
    },
    onTextChanged: function() {
        var newText = this.refs.input.getDOMNode().value;
        if (newText.search(/[^a-z0-9\-\_]/ig) >= 0)
            return;
        this.setState({text: newText});
    },
    componentDidMount: function() {
        if (this.props.text) {
            this.setState({
                text: this.props.text
            });
        }
    },
    onTextOk: function() {
        if (!this.props.onOK)
            return;
        this.props.onOK(this.state.text);
    },
    render: function() {
        var that = this;
        var dialogWrapperClassName = "dialog-wrapper";
        if (this.props.level)
            dialogWrapperClassName += "-" + this.props.level;

        var textInput = null;
        if (this.props.text) {
            textInput = function() {
                return (
                    <input ref="input" type="text" className="text-input"
                        onChange={that.onTextChanged} value={that.state.text}
                        autofocus />
                );
            }();
        }
        var okButton = null;
        if (this.props.onOK) {
            var okCallback = this.props.onOK;
            if (textInput) {
                okCallback = function() {
                    that.props.onOK(that.state.text);
                };
            }
            okButton = function() {
                return (
                    <span className="button" onClick={okCallback}>OK</span>
                );
            }();
        }
        var cancelButton = null;
        if (this.props.onCancel) {
            cancelButton = function() {
                return (
                    <span className="button" onClick={that.props.onCancel}>
                        Cancel
                    </span>
                );
            }();
        }
        var defaultAction = this.props.onCancel ?
            this.props.onCancel : this.props.onOK;

        return (
            <div className={dialogWrapperClassName}>
                <div className="dialog-bg" onClick={defaultAction}></div>
                <div className="dialog">
                    <div className="prompt">{this.props.prompt}</div>
                    {textInput}
                    <div className="bottom">
                        {okButton}
                        {cancelButton}
                    </div>
                </div>
            </div>
        );
    }
});

var ProjectDialog = React.createClass({
    getInitialState: function() {
        return {
            name: '',
            srcFileIds: []
        };
    },
    onCloseSubdialog: function() {
        React.unmountComponentAtNode(this.refs.subdialog.getDOMNode());
    },
    onChangeName: function() {
        var that = this;
        var cancel = this.onCloseSubdialog;
        var ok = function(text) {
            that.setState({name: text});
            that.onCloseSubdialog();
        };
        React.render(<InputDialog onOK={ok} onCancel={cancel} level="1"
                         text={this.state.name}
                         prompt="New project name?"  />,
                     this.refs.subdialog.getDOMNode());
    },
    onChangeFileName: function(fname, ind) {
        var that = this;
        var cancel = this.onCloseSubdialog;
        var ok = function(text) {
            var fids = that.state.srcFileIds;
            fids[ind][1] = text + '.py';
            that.setState({srcFileIds: fids});
            that.onCloseSubdialog();
        };
        var text = fname.replace('\.py', '');
        React.render(<InputDialog onOK={ok} onCancel={cancel} level="1"
                         text={text}
                         prompt="New file name?"  />,
                     this.refs.subdialog.getDOMNode());
    },
    onSwapFile: function(aind, bind) {
        var fids = this.state.srcFileIds;
        if (aind >= 0 && aind < fids.length && bind >= 0 && bind < fids.length) {
            var tmp = fids[aind];
            fids[aind] = fids[bind];
            fids[bind] = tmp;
            this.setState({srcFileIds: fids});
        }
    },
    onDeleteFile: function(fid, fname) {
        var cancel = this.onCloseSubdialog;
        if (this.state.srcFileIds.length == 1) {
            React.render(
                <InputDialog onOK={cancel} level="1"
                    prompt="Cannot remove.  Need at least one source file." />,
                this.refs.subdialog.getDOMNode());
            return;
        }

        var that = this;
        var prompt = "Really delete " + fname + "?";
        var ok = function() {
            var newFids = [];
            for (var i = 0; i < that.state.srcFileIds.length; i++) {
                if (that.state.srcFileIds[i][0] != fid)
                    newFids.push(that.state.srcFileIds[i]);
            }
            that.setState({srcFileIds: newFids});
            that.onCloseSubdialog();
        };
        React.render(<InputDialog onOK={ok} onCancel={cancel} level="1"
                         prompt={prompt} />,
                     this.refs.subdialog.getDOMNode());
    },
    onCancel: function() {
        if (this.props.onCancel)
            this.props.onCancel();
    },
    onOK: function() {
        if (this.props.onOK) {
            var proj = {
                name: this.state.name
            }
            this.props.onOK(proj);
        }
    },
    componentDidMount: function() {
        this.setState({
            name: this.props.proj.name,
            srcFileIds: this.props.proj.srcFileIds
        });
    },
    onAddFile: function() {
        var ids = this.state.srcFileIds;
        var n = Math.floor(Math.random() * 10000);
        ids.push([skulptgl.util.makeId(), "new-file" + n + ".py"]);

        this.setState({srcFileIds: ids});
    },
    render: function() {
        var that = this;
        files = this.state.srcFileIds.map(
            function(fidName, ind) {
                var fileName = fidName[1];
                var deleteFile =
                    function() { that.onDeleteFile(fidName[0], fileName) };
                var fileUp =
                    function() { that.onSwapFile(ind, ind - 1) };
                var fileDown =
                    function() { that.onSwapFile(ind, ind + 1) };
                var fileNameChange =
                    function() { that.onChangeFileName(fileName, ind); };
                return (
                    <div key={ind} className="file-entry">
                        <span className="name-button" onClick={fileNameChange}>
                            {fileName}
                        </span>
                        <div>
                            <img src="/img/expand39.png" onClick={fileUp}
                                className="file-button" />
                            <img src="/img/downwards.png" onClick={fileDown}
                                className="file-button" />
                            <img src="/img/close47.png" onClick={deleteFile}
                                className="file-button" />
                        </div>
                    </div>
                );
            }
        );
        return (
            <div className="dialog-wrapper">
                <div ref="subdialog"></div>
                <div className="dialog-bg" onClick={this.onCancel}></div>
                <div className="dialog">
                    <div className="project-name" onClick={this.onChangeName}>
                        {this.state.name}
                    </div>
                    <div className="file-list">{files}</div>
                    <div>
                        <img src="/img/add186.png"
                            className="add-file-button"
                            onClick={this.onAddFile} />
                    </div>
                    <div className="bottom">
                        <span className="button" onClick={this.onOK}>OK</span>
                        <span className="button" onClick={this.onCancel}>
                            Cancel</span>
                    </div>
                </div>
            </div>
        );
    }
});
