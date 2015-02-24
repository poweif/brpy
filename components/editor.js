var SourceEditor = React.createClass({
    cdm: null,
    getInitialState: function() {
        return {
            cdm: null
        };
    },
    getContent: function() {
        if (!this.state.cdm)
            return null;
        return this.cdm.state.getValue();
    },
    onScrollTo: function() {
        if (!this.state.cdm)
            return;
        var cursorPos = (this.state.cdm.cursorCoords().top +
                         this.state.cdm.cursorCoords().bottom) / 2;
        var winHeight = window.innerHeight;
        window.scrollTo(0, cursorPos - (winHeight / 2));
    },
    componentDidUpdate: function(prevProps, prevState) {
        console.log("did update " + prevProps.height, " ", this.props.height);
        if (this.props.src != prevProps.src) {
            var code = this.props.src;
            if (!this.state.cdm) {
                this.refs.textarea.getDOMNode().value = code;
                this.setState({
                    cdm: CodeMirror.fromTextArea(
                        this.refs.textarea.getDOMNode(),
                        {
                            lineNumbers: true,
                            lineWrapping: true,
                            mode: "python",
                            keyMap: "emacs",
                            autoCloseBrackets: true,
                            matchBrackets: true,
                            showCursorWhenSelecting: true,
                            theme: "monokai"
                        }
                    )
                });
            }
        }

        if (this.props.height != prevProps.height && this.state.cdm) {
            console.log(Math.max(1 ,this.props.height), " ", this.props.height);
            this.state.cdm.setSize(650, Math.max(1, this.props.height));
            this.state.cdm.refresh();
        }
    },
    componentDidMount: function() {
        console.log("mounting!!!!");
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        var that = this;

        if (this.props.onRun) {
            var run = function() {
                if (that.state.cdm)
                    that.props.onRun(that.state.cdm.getValue());
            };
            shortcut.add('Ctrl+B', run, keyMapParams);
        }

        if (this.props.onSave) {
            var save = function() {
                if (that.state.cdm)
                    that.props.onSave(that.state.cdm.getValue());
            };
            shortcut.add('Ctrl+S', save, keyMapParams);
        }
        // Technically this should be in codemirror's emacs keymap, but putting
        // this here for now.
        shortcut.add('Ctrl+L', this.onScrollTo, keyMapParams);
    },
    componentWillUnmount: function() {
        shortcut.remove('Ctrl+B');
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
    },
    maxHeight: function() {
        if (!this.state.cdm) {
            console.log("early out ", this.state.cdm, this);
            return 400;
        }
        var height = this.state.cdm.heightAtLine(10000, "local") + 4;
        console.log("doc count: " + this.state.cdm.lineCount() + " height: " + height);
        return this.state.cdm.heightAtLine(10000, "local") + 4;
    },
    render: function() {
        var editorInnerCn = "codearea";
        return (
            <div ref="editorInner" className={editorInnerCn}>
                <textarea ref="textarea"></textarea>
            </div>
        );
    }
});
