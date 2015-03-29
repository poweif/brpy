var SourceEditor = React.createClass({
    cdm: null,
    getInitialState: function() {
        return {
            unsaved: false,
            extended: false
        };
    },
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
    onDocChange: function() {
        if (!this.state.unsaved)
            this.setState({unsaved: true});
    },
    attachKeyMap: function(cdm) {
        var that = this;
        var keymap = {
            "Shift-Enter": function() {
                if (that.cdm) {
                    that.save();
                    that.props.onRun(that.getContent());
                }
            }
        };
        cdm.addKeyMap(CodeMirror.normalizeKeyMap(keymap));
    },
    createCDM: function() {
        var cdm = CodeMirror.fromTextArea(
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
        this.attachKeyMap(cdm);
        return cdm;
    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        var cdm = this.cdm ? this.cdm : this.createCDM();
        var isNewCdm = this.cdm != cdm;
        var inputCodeDiffer = this.props.src != prevProps.src;

        if (inputCodeDiffer || isNewCdm) {
            var contentCodeDiffer = this.props.src != this.getContent();
            var code = this.props.src;
            if (code && code != this.getContent()) {
                cdm.getDoc().off('change', this.onDocChange);
                cdm.getDoc().setValue(code);
                cdm.scrollIntoView({line: cdm.getDoc().lastLine(), pos: 0});
                cdm.scrollIntoView({line: 0, pos: 0});
                cdm.getDoc().on('change', this.onDocChange);
            }
            cdm.setSize(650, this.props.height);
            cdm.refresh();
            if (this.props.resize)
                this.props.resize();
        }

        if (this.props.height != prevProps.height
            || (this.props.height && isNewCdm)) {
            cdm.setSize(650, Math.max(1, this.props.height));
            cdm.refresh();
        }

        if (this.props.offsetY != prevProps.offsetY
            || (this.props.offsetY && isNewCdm)) {
            cdm.scrollTo(null, this.props.offsetY);
            cdm.refresh();
        }

        if (isNewCdm) {
            this.cdm = cdm;
        }
    },
    componentDidMount: function() {
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
    },
    componentWillUnmount: function() {
//        shortcut.remove('Ctrl+S');
    },
    save: function() {
        if (this.state.unsaved) {
            this.props.onSave(this.getContent());
            this.setState({unsaved: false});
        }
    },
    changeOffsetY: function() {
        if (this.props.onOffsetY && this.cdm) {
            this.props.onOffsetY(this.cdm.getScrollInfo().top);
        };
    },
    maxHeight: function() {
        if (!this.cdm) {
            return 200;
        }
        var height = this.cdm.heightAtLine(
            this.cdm.getDoc().lastLine(), "local") + 20;
        return height;
    },
    render: function() {
        var editorInnerCn = "codearea";
        if (this.state.unsaved)
            editorInnerCn += " unsaved";
        return (
            <div ref="editorInner" className={editorInnerCn}>
                <textarea ref="textarea"></textarea>
            </div>
        );
    }
});
