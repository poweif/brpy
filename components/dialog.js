var InputDialog = React.createClass({
    // options: (can be sent through a map attribute)
    //     'allowAll' => no restriction on input characters.
    //     'multiline' => a number indicating the number of lines in the
    //         text input.
    //     'maxLength' => the max number of characters allowed in the text
    //         input.
    getInitialState: function() {
        return {
            text: null,
            currentChoice: null,
            charactersLeft: null
        };
    },
    onTextChanged: function() {
        var newText = this.refs.input.getDOMNode().value;
        if (!this.props.options.allowAll &&
            newText.search(/[^a-z0-9\-\_]/ig) >= 0 || newText.length == 0)
            return;

        if (this.props.options.maxLength) {
            if (newText.length > this.props.options.maxLength)
                return;
            else {
                this.setState({
                    charactersLeft: this.props.options.maxLength - newText.length
                });
            }
        }
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
        if (this.props.options && this.props.options.maxLength &&
            this.props.text) {
            this.setState({
                charactersLeft: (this.props.options.maxLength -
                                 this.props.text.length)
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
        var charLeft = null;
        if (this.props.text) {
            input = function() {
                return (
                    <input ref="input" type="text" className="text-input"
                        onChange={that.onTextChanged} value={that.state.text}
                        autofocus />
                );
            }();
            if (this.props.options.multiline) {
                input = function() {
                    return (
                        <textarea ref="input" className="text-input-large"
                            onChange={that.onTextChanged}
                            value={that.state.text} autofocus />
                    );
                }();
            }
            if (this.state.charactersLeft != null) {
                charLeft = function() {
                    return (
                        <div>{that.state.charactersLeft} characters left</div>
                    );
                }();
            }
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
                    {charLeft}
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
    var closeDialogPrime = function() {
        if (!openedDialog)
            return;
        var onfinish = function() {
            React.unmountComponentAtNode(document.getElementById('dialog0'));
            openedDialog = null;
        };
        openedDialog.close(onfinish);
    };
    var openTextDialog = function(text, prompt, options, onOK, onCancel) {
        closeDialogPrime();
        openedDialog = React.render(
            <InputDialog text={text} prompt={prompt} onOK={onOK}
                onCancel={onCancel} options={options} />,
            document.getElementById('dialog0'));
    };
    var openChoicesDialog = function(choices, prompt, options, onOK, onCancel) {
        closeDialogPrime();
        openedDialog = React.render(
            <InputDialog choices={choices} prompt={prompt}
                onOK={onOK} onCancel={onCancel} options={options}/>,
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
            openTextDialog: function(text, prompt, options, onOK) {
                if (!options) options = {};
                openTextDialog(text, prompt, options, onOK, this.closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openPromptDialog: function(prompt) {
                openTextDialog(null, prompt, {}, closeDialog, null);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openBinaryDialog: function(prompt, onOK) {
                openTextDialog(null, prompt, {}, onOK, this.closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openChoicesDialog: function(choices, prompt, onOK) {
                openChoicesDialog(choices, prompt, {}, onOK, this.closeDialog);
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            openWorkingDialog: function() {
                loadingDialog();
                if (setDialogOpen)
                    setDialogOpen.bind(this)(true);
            },
            closeDialog: function() {
                closeDialogPrime();
                if (setDialogOpen)
                    setDialogOpen.bind(this)(false);
            }
        };
    };
}();
