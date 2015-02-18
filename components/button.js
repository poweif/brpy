var Button =  React.createClass({
    render: function() {
        var that = this;
        var imgCn = ""
        var textCn = "button-text";

        if (this.props.large) {
            imgCn += " button-large";
            textCn += " font-large";
        } else if (this.props.mid) {
            imgCn += " button-mid";
            textCn += " font-mid";
        } else {
            imgCn += " button-small";
            textCn += " font-small";
        }

        if (this.props.selected) {
            imgCn += " button-selected";
        }


        var buttonText = !that.props.text ? null : function() {
            return (
                <div className={textCn}>{that.props.text}</div>
            );
        }();

        var img = !this.props.icon ? null : function() {
            var imgSrc = "/img/" + that.props.icon + ".png";
            var click = null;
            var nclassName = imgCn;
            if (!buttonText) {
                click = that.props.click;
                nclassName = "button" + nclassName;
                if (that.props.selected)
                    nclassName += " button-selected";
                if (that.props.addClass)
                    nclassName += " " + that.props.addClass;
            }
            return (
                <img src={imgSrc} className={nclassName}
                    onClick={click} />
            );
        }();


        if (img && !buttonText)
            return img;

        var wrapperCn = "button-wrapper";
        if (this.props.selected)
            wrapperCn += " button-selected";

        if (this.props.addClass)
            wrapperCn += " " + that.props.addClass;

        return (
            <div className={wrapperCn} onClick={this.props.click}>
                {this.props.rev ? buttonText : img}
                {this.props.rev ? img : buttonText}
            </div>
        );
    }
});

var MenuHr = React.createClass({
    render: function() {
        return (
            <div className="hr">
              {this.props.text}
            </div>
        );
    }
});

var ButtonMenu =  React.createClass({
    click: null,
    getInitialState: function() {
        return {
            hidden: true,
        };
    },
    onClickMain: function () {
        this.setState({hidden: !this.state.hidden});
    },
    windowMouseClick: function(obj, e) {
        if (!obj.refs.items) return;

        var rect = obj.refs.items.getDOMNode().getBoundingClientRect();
        if (e.clientX > rect.right || e.clientX < rect.left ||
            e.clientY < rect.top || e.clientY > rect.bottom) {
            obj.setState({hidden: true});
        }
    },
    componentDidUpdate: function() {
        if (this.refs.items && !this.state.hidden) {
            var main = this.refs.main.getDOMNode();
            var items = this.refs.items.getDOMNode();
            var itemsWidth = items.clientWidth;
            var mainWidth = main.clientWidth;
            if (itemsWidth > mainWidth) {
                main.classList.remove("main-button-larger");
                main.classList.add("main-button-smaller");
                items.classList.add("items-larger");
            } else if (itemsWidth < mainWidth) {
                main.classList.remove("main-button-smaller");
                items.classList.remove("items-larger");
                main.classList.add("main-button-larger");
            }
        }

        if (this.refs.items && !this.click) {
            var obj = this;
            this.click = function(e) {
                return obj.windowMouseClick(obj, e);
            }
            window.document.body.addEventListener('click', this.click);
        }

        if (this.click && !this.refs.items) {
            window.document.body.removeEventListener('click', this.click);
            this.click = null;
        }
    },
    render: function() {
        var that = this;
        var mainButton = function() {
            return (
                <Button ref="main" rev large={that.props.large}
                    selected={!that.state.hidden || that.props.selected}
                    mid={that.props.mid}
                    small={that.props.small}
                    addClass={that.state.hidden ?
                              "main-button "  + that.props.addClass :
                              "main-button"}
                    click={that.onClickMain} text={that.props.text}
                    icon={that.props.icon} />
            );
        }();

        var buttonMenuCn = "button-menu";
        if (this.state.hidden)
            return mainButton;

        if (this.props.center) {
            buttonMenuCn += " button-menu-center";
        } else if (this.props.right) {
            buttonMenuCn += " button-menu-right";
        }
        if (this.props.addClass) {
            buttonMenuCn += " " + this.props.addClass;
        }

        var onClickWrapper = function(callback) {
            return function() {
                that.setState({hidden: true});
                callback();
            };
        };

        var items = !this.props.items ?
            [] :
            this.props.items.map(function(item, ind) {
                if (item.hr) {
                    return (
                        <span className="vspace">
                            <MenuHr text={item.text} key={ind}/>
                        </span>
                    );
                }
                var click = onClickWrapper(item.click);
                return (
                    <span className="vspace">
                        <Button text={item.text} click={click} key={ind}
                            icon={item.icon} />
                    </span>
                );
            });

        return (
            <div className={buttonMenuCn}>
                {mainButton}
                <div ref="items" className="items">
                    {items}
                </div>
            </div>
        );
    }
});
