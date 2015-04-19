var InputDialog = React.createClass({
    getInitialState: function() {
        return {
            text: null,
            currentChoice: null
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
        if (this.props.choices) {
            this.setState({
                currentChoice: this.props.choices[0]
            });
        }
    },
    onTextOk: function() {
        if (!this.props.onOK)
            return;
        this.props.onOK(this.state.text);
    },
    close: function(finish) {
        this.getDOMNode().addEventListener('animationend', finish, false);
        this.getDOMNode().addEventListener('webkitAnimationEnd', finish, false);
        this.getDOMNode().classList.remove('dialog-fade-in');
        this.getDOMNode().classList.add('dialog-fade-out');
    },
    render: function() {
        var that = this;
        var dialogWrapperCn = "dialog-wrapper dialog-fade-in";
        if (this.props.level)
            dialogWrapperCn += "-" + this.props.level;

        var input = null;
        if (this.props.text) {
            input = function() {
                return (
                    <input ref="input" type="text" className="text-input"
                        onChange={that.onTextChanged} value={that.state.text}
                        autofocus />
                );
            }();
        }
        var choiceInput = null;
        if (this.props.choices) {
            input = null;
            var items = [];
            this.props.choices.forEach(function(choice) {
                if (choice == that.state.currentChoice)
                    return;

                var click = function() {
                    that.setState({currentChoice: choice});
                };
                items.push({text: choice, click: click});
            });
            choiceInput = function() {
                return (
                    <ButtonMenu center items={items} addClass="choices-input"
                        text={that.state.currentChoice} />
                );
            }();
        }
        var okButton = null;
        if (this.props.onOK) {
            var okCallback = this.props.onOK;
            if (input) {
                okCallback = function() {
                    that.props.onOK(that.state.text);
                };
            }

            if (choiceInput) {
                okCallback = function() {
                    var i = SKG.util.indexOf(
                        that.props.choices, that.state.currentChoice);
                    that.props.onOK(i);
                };
            }

            okButton = function() {
                return (
                    <Button addClass="binary-button" click={okCallback}
                        text="Ok" />
                );
            }();
        }
        var cancelButton = null;
        if (this.props.onCancel) {
            cancelButton = function() {
                return (
                    <Button addClass="button" click={that.props.onCancel}
                        text="Cancel" />
                );
            }();
        }
        var defaultAction = this.props.onCancel ?
            this.props.onCancel : this.props.onOK;

        return (
            <div className={dialogWrapperCn}>
                <div className="dialog-bg" onClick={defaultAction}></div>
                <div className="dialog">
                    <div className="prompt">{this.props.prompt}</div>
                    {input}
                    {choiceInput}
                    <div className="bottom">
                        {okButton}
                        {cancelButton}
                    </div>
                </div>
            </div>
        );
    }
});

var Loader = React.createClass({
    componentDidMount: function() {
        if (this.props.size) {
            this.getDOMNode().style.width = this.getDOMNode().style.height =
                this.props.size + 'px';
            this.getDOMNode().style.borderWidth =
                Math.max(1, (this.props.size / 10)) + "px";
        }
        if (this.props.color) {
            this.getDOMNode().style.borderTopColor = this.props.color;
        }
    },
    render: function() {
        return (
            <div className="loader"></div>
        );
    }
});

var LoadingDialog = React.createClass({
    onFinish: null,
    getInitialState: function() {
        return {};
    },
    reopen: function() {
        var finish = this.onFinish;
        this.getDOMNode().removeEventListener('animationend', finish, false);
        this.getDOMNode().removeEventListener(
            'webkitAnimationEnd', finish, false);
        this.getDOMNode().classList.add('dialog-fade-in');
        this.getDOMNode().classList.remove('dialog-fade-out');
        this.onFinish = null;
    },
    close: function(finish) {
        this.onFinish = finish;
        this.getDOMNode().addEventListener('animationend', finish, false);
        this.getDOMNode().addEventListener('webkitAnimationEnd', finish, false);
        this.getDOMNode().classList.remove('dialog-fade-in');
        this.getDOMNode().classList.add('dialog-fade-out');
    },
    componentDidMount: function() {},
    render: function() {
        var dialogWrapperCn = "dialog-wrapper dialog-fade-in";
        return (
            <div className={dialogWrapperCn}>
                <div className="dialog-bg"></div>
                <div className="loader-wrapper">
                    <Loader size="100" color="#eeeeee"/>
                </div>
            </div>
        );
    }
});

var TextInputDialog = React.createClass({
    render: function() {
        return (
            <div className={dialogWrapperCn}>
                <div className="dialog-bg" onClick={defaultAction}></div>
                <div className="dialog">
                    <textarea ref="textarea"></textarea>
                    <div className="prompt">{this.props.prompt}</div>
                    {input}
                    {choiceInput}
                    <div className="bottom">
                        {okButton}
                        {cancelButton}
                    </div>
                </div>
            </div>
        );
    }
});

var DialogMixins = function() {
    var openedDialog = null;
    var closeDialog = function() {
        if (!openedDialog)
            return;
        var onfinish = function() {
            React.unmountComponentAtNode(document.getElementById('dialog0'));
            openedDialog = null;
        };
        openedDialog.close(onfinish);
    };
    var openDialog = function(text, choices, prompt, onOK, onCancel) {
        closeDialog();
        openedDialog = React.render(
            <InputDialog text={text} choices={choices} prompt={prompt}
                onOK={onOK} onCancel={onCancel} />,
            document.getElementById('dialog0'));
    };
    var loadingDialog = function() {
        if (openedDialog && openedDialog.reopen) {
            openedDialog.reopen();
            return;
        }
        openedDialog = React.render(
            <LoadingDialog />, document.getElementById('dialog0'));
    };

    return function(setDialogOpen) {
        return {
            openTextDialog: function(text, prompt, onOK) {
                openDialog(text, null, prompt, onOK, closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openPromptDialog: function(prompt) {
                openDialog(null, null, prompt, closeDialog, null);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openBinaryDialog: function(prompt, onOK) {
                openDialog(null, null, prompt, onOK, closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openChoicesDialog: function(choices, prompt, onOK) {
                openDialog(null, choices, prompt, onOK, closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openWorkingDialog: function() {
                loadingDialog();
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            closeDialog: function() {
                closeDialog();
                if (setDialogOpen)
                    setDialogOpen.bind(this)(false);
            },
            openTextInputDialog: function() {

            }
        };
    };
}();
