var InputDialog = React.createClass({
    getInitialState: function() {
        return {
            text: null
        };
    },
    onTextChanged: function() {
        var newText = this.refs.input.getDOMNode().value;
        if (newText.search(/[^a-z0-9\-\_]/ig) >= 0 || newText.length == 0)
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

var DialogMixins = function(setDialogOpen) {
    return {
        openTextDialog: function(text, prompt, onOK) {
            skulptgl.openDialog(text, prompt, onOK, this.closeDialog);
            if (setDialogOpen)
                setDialogOpen.bind(this)(true);
        },
        openPromptDialog: function(prompt) {
            skulptgl.openDialog(null, prompt, this.closeDialog, null);
            if (setDialogOpen)
                setDialogOpen.bind(this)(true);
        },
        openBinaryDialog: function(prompt, onOK) {
            skulptgl.openDialog(null, prompt, onOK, this.closeDialog);
            if (setDialogOpen)
                setDialogOpen.bind(this)(true);
        },
        openWorkingDialog: function() {
            skulptgl.openDialog(null, "Working...", null, null);
            if (setDialogOpen)
                setDialogOpen.bind(this)(true);
        },
        closeDialog: function() {
            skulptgl.closeDialog();
            if (setDialogOpen)
                setDialogOpen.bind(this)(false);
        }
    };
};
