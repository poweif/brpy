var InputDialog = React.createClass({
    onTextChanged: function() {
        console.log(this.refs.input.getDOMNode().value);
        this.refs.input.getDOMNode().value = 'abc';
    },
    render: function() {
        var dialogWrapperClassName = "dialog-wrapper";
        if (this.props.level) {
            dialogWrapperClassName += "-" + this.props.level;
        }

        var textInput = null;
        if (this.props.text) {
            var that = this;
            textInput = function() {
                return (
                    <input className="text-input" ref="input" type="text"
                        cols="30" autofocus value={that.props.text}
                        onChange={that.onTextChanged}/>
                );
            }();
        }

        return (
            <div className={dialogWrapperClassName}>
                <div className="dialog-bg" onClick={this.props.onCancel}></div>
                <div className="dialog">
                    <div className="prompt">{this.props.prompt}</div>
                    {textInput}
                    <div className="bottom">
                        <span className="button" onClick={this.props.onOK}>
                            OK
                        </span>
                        <span className="button" onClick={this.props.onCancel}>
                            Cancel
                       </span>
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
        var ok = this.onCloseSubdialog;
        React.render(<InputDialog onOK={ok} onCancel={ok} level="1"
                         text={this.state.name}
                         prompt="New project name?"  />,
                     this.refs.subdialog.getDOMNode());
    },
    onDeleteFile: function(fid, fname) {
        var prompt = "Really delete " + fname + "?";
        var that = this;
        var cancel = this.onCloseSubdialog;
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
        skulptgl.closeProjectDialog();
    },
    onOK: function() {

    },
    componentDidMount: function() {
        this.setState({
            name: this.props.proj.name,
            srcFileIds: this.props.proj.srcFileIds
        });
    },
    onAddFile: function() {
        var ids = this.state.srcFileIds;
        var N = 10000;
        var n = Math.floor(Math.random() * N);
        ids.push([skulptgl.util.makeId(), "file" + n + ".py"]);
        this.setState({srcFileIds: ids});
    },
    render: function() {
        var that = this;
        files = this.state.srcFileIds.map(
            function(fileId, ind) {
                var fileName = fileId[1];
                var deleteFile = function() {
                    that.onDeleteFile(fileId[0], fileName)
                };
                return (
                    <div key={ind} className="file-entry">
                        <span className="name-button">{fileName}</span>
                        <div>
                            <img src="/img/expand39.png" className="file-button" />
                            <img src="/img/downwards.png" className="file-button" />
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
