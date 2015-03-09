var SourceEditor = React.createClass({
    cdm: null,
    getInitialState: function() {
        return {
            cdm: null,
            unsaved: false
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
    onDocChange: function() {
        if (!this.state.unsaved)
            this.setState({unsaved: true});
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
                    "Shift-Enter": function() {
                        if (that.state.cdm) {
                            var scrollY = that.state.cdm.getScrollInfo().top;
                            console.log('scroll y: ' + scrollY);
//                            if (that.state.unsaved)
                            that.save(that.getContent(), scrollY, true);
                            that.props.onRun(that.getContent());
                        }
                    }
                };
                cdm.addKeyMap(CodeMirror.normalizeKeyMap(keymap));
                this.setState({cdm: cdm});
            }

            if (code && code != this.getContent()) {
                cdm.getDoc().off('change', this.onDocChange);
                cdm.getDoc().setValue(code);
                cdm.scrollIntoView({line: cdm.getDoc().lastLine(), pos: 0});
                cdm.scrollIntoView({line: 0, pos: 0});
                that.save(that.getContent(), cdm.getScrollInfo().top, true);

                console.log(cdm.getScrollInfo().top);

                cdm.getDoc().on('change', this.onDocChange);
//                console.log('scroll to : ', this.props.scrollY, " ", code.substring(0, 10));
                cdm.scrollTo(null, this.props.scrollY);
                console.log(cdm.getViewport());
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

        if (this.props.scrollY != prevProps.scrollY && this.state.cdm) {
            this.state.cdm.scrollTo(null, this.props.scrollY);
        } else {
            //console.log('bah: ', this.props.scrollY);
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

        shortcut.add('Ctrl+S', function() {}, keyMapParams);
        shortcut.add('Ctrl+L', this.onScrollTo, keyMapParams);

        if (this.props.scrollY && this.state.cdm) {
            console.log(this.props.scrollY);
            this.state.cdm.scrollTo({y: this.props.scrollY});
        }
        console.log('c: ', this.props.scrollY);
    },
    componentWillUnmount: function() {
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
    },
    save: function(text, scrollY, setState) {
        if (this.props.onSave && this.state.unsaved) {
            this.props.onSave(text, scrollY);
            if (setState)
                this.setState({unsaved: false});
        }
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
        if (this.state.unsaved)
            editorInnerCn += " unsaved";
        return (
            <div ref="editorInner" className={editorInnerCn}>
                <textarea ref="textarea"></textarea>
            </div>
        );
    }
});
