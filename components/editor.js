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
        return this.state.cdm.getValue();
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
        var that = this;
        if (this.props.src != prevProps.src || !this.state.cdm) {
            var code = this.props.src;
            var cdm = this.state.cdm;
            if (!cdm) {
                cdm = CodeMirror.fromTextArea(
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
                );
                var keymap = {
                    "Ctrl-B" : function() {
                        if (that.state.cdm)
                            that.props.onRun(that.getContent());
                    }
                };
                cdm.addKeyMap(CodeMirror.normalizeKeyMap(keymap));
                this.setState({cdm: cdm});
            }

            if (code) {
                cdm.getDoc().setValue(code);
                cdm.scrollIntoView({line: cdm.getDoc().lastLine(), pos: 0});
                cdm.scrollIntoView({line: 0, pos: 0});
            }
            if (this.props.resize)
                this.props.resize();
            cdm.setSize(
                650,
                Math.max(1, this.props.height != null ? this.props.height : 0));
            cdm.refresh();
        }

        if (this.props.height != prevProps.height && this.state.cdm) {
            this.state.cdm.setSize(650, Math.max(1, this.props.height));
            this.state.cdm.refresh();
        }

        if (this.state.cdm != prevState.cdm && this.props.resize)
            this.props.resize();
    },
    componentDidMount: function() {
        this.setState({cdm: null});

        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        var that = this;

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
            return 100;
        }
        var height = this.state.cdm.heightAtLine(
            this.state.cdm.getDoc().lastLine(), "local") + 20;
        return height;
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
