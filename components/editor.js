var SourceEditor = React.createClass({
    cdm: null,
    getContent: function() {
        if (!this.cdm)
            return null;
        return this.cdm.getValue();
    },
    onScrollTo: function() {
        if (!this.cdm)
            return;
        var cursorPos = (this.cdm.cursorCoords().top +
                         this.cdm.cursorCoords().bottom) / 2;
        var winHeight = window.innerHeight;
        window.scrollTo(0, cursorPos - (winHeight / 2));
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.src) {
            var code = this.props.src;
            if (!this.cdm) {
                this.refs.textarea.getDOMNode().value = code;
                this.cdm = CodeMirror.fromTextArea(
                    this.refs.textarea.getDOMNode(),
                    {
                        lineNumbers: true,
                        lineWrapping: true,
                        mode: "python",
                        keyMap: "emacs",
                        autoCloseBrackets: true,
                        matchBrackets: true,
                        showCursorWhenSelecting: true,
                        theme: "monokai",
                        height: "auto",
                        viewportMargin: Infinity
                    }
                );
                this.cdm.setSize(650, "100%");
            } else {
                this.cdm.setValue(code);
            }
        }
    },
    componentDidMount: function() {
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        var that = this;

        if (this.props.onRun) {
            var run = function() {
                if (that.cdm)
                    that.props.onRun(that.cdm.getValue());
            };
            shortcut.add('Ctrl+B', run, keyMapParams);
        }

        if (this.props.onSave) {
            var save = function() {
                if (that.cdm)
                    that.props.onSave(that.cdm.getValue());
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
        if (!this.refs.editorInner)
            return 0;
        return this.refs.editorInner.getDOMNode().getBoundingClientRect().height;
    },
    render: function() {
        var editorInnerCn = this.props.isDialogOpen ? "codearea-hidden" : "codearea";
        return (
            <div ref="editorInner" className={editorInnerCn}>
                <textarea ref="textarea"></textarea>
            </div>
        );
    }
});
