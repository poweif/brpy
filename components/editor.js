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
                    that.save(that.getContent(), true);
                    that.props.onRun(that.getContent());
                }
            }
        };
        cdm.addKeyMap(CodeMirror.normalizeKeyMap(keymap));
    },
    createCDM: function() {
        console.log("create cdm");
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

        var inputCodeDiffer = this.props.src != prevProps.src;
        var contentCodeDiffer = this.props.src != this.getContent();
        if (inputCodeDiffer || (this.cdm != cdm)) {
//            if (contentCodeDiffer && this.props.onOffsetY) {
//                this.props.onOffsetY(cdm.getScrollInfo().top);
//            }

            var code = this.props.src;
            if (code && code != this.getContent()) {
                cdm.getDoc().off('change', this.onDocChange);
                cdm.getDoc().setValue(code);
                cdm.scrollIntoView({line: cdm.getDoc().lastLine(), pos: 0});
                cdm.scrollIntoView({line: 0, pos: 0});
                that.save(that.getContent(), true);
                cdm.getDoc().on('change', this.onDocChange);
            }
            cdm.setSize(
                650, this.props.height ? Math.max(1, this.props.height) : 100);
            cdm.refresh();
        }


        if (this.props.height != prevProps.height && cdm) {
            cdm.setSize(650, Math.max(1, this.props.height));
            cdm.refresh();
        }

        if (cdm != this.cdm) {
            this.cdm = cdm;
        }

        if (this.props.offsetY != prevProps.offsetY) {
            console.log(this.props.offsetY);
            cdm.scrollTo(null, this.props.offsetY);
        }
    },
    componentDidMount: function() {
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        var that = this;

        shortcut.add('Ctrl+S', function() {}, keyMapParams);
    },
    componentWillUnmount: function() {
        shortcut.remove('Ctrl+S');
    },
    save: function(text, setState) {
        if (this.props.onSave && this.state.unsaved) {
            console.log('save state');
            this.props.onSave(text);
            if (setState)
                this.setState({unsaved: false});
        }
        if (this.props.onOffsetY && this.cdm) {
            console.log("saving: " + this.cdm.getScrollInfo().top);
            this.props.onOffsetY(this.cdm.getScrollInfo().top);
        }
    },
    maxHeight: function() {
        if (!this.cdm) {
            console.log("max height: ~100");
            return 100;
        }
        var height = this.cdm.heightAtLine(
            this.cdm.getDoc().lastLine(), "local") + 20;
        console.log("max height: " + height);
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
