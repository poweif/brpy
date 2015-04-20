var Button =  React.createClass({
    render: function() {
        var that = this;
        var suffix = '';

        if (this.props.large) {
            suffix = '-large';
        } else if (this.props.mid) {
            suffix = '-mid';
        } else if (this.props.tiny) {
            suffix = '-tiny';
        } else {
            suffix = '-small';
        }
        var wrapperCn= "button-wrapper" + suffix;

        var buttonText = !that.props.text ? null : function() {
            return (
                <div className={"button-text font" + suffix}>{that.props.text}
                </div>
            );
        }();

        var outerClick = this.props.click;
        if (this.props.link) {
            outerClick = function() {
                if (that.props.click)
                    that.props.click();
                window.location.href = that.props.link;
            };
        }

        if (!buttonText && this.props.icon) {
            var imgSrc = "/img/" + this.props.icon + ".png";
            var nclassName = "";
            if (that.props.selected)
                nclassName += " button-selected";
            if (that.props.addClass)
                nclassName += " " + that.props.addClass;
            nclassName += " button-img-only" + suffix;

            return (
                <img src={imgSrc} className={nclassName} onClick={outerClick} />
            );
        }

        if (this.props.selected)
            wrapperCn += " button-selected";

        if (this.props.addClass)
            wrapperCn += " " + that.props.addClass;

        var img = !this.props.icon ? null : function() {
            var imgSrc = "/img/" + that.props.icon + ".png";
            return (
                <img src={imgSrc} className={"button" + suffix} />
            );
        }();

        return (
            <div className={wrapperCn} onClick={outerClick}>
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
            setTimeout(function() {
                if (obj.isMounted())
                    obj.setState({hidden: true});
            }, 100);
        }
    },
    componentDidUpdate: function() {
        if (this.refs.items && !this.state.hidden) {
            var main = this.refs.main.getDOMNode();
            var items = this.refs.items.getDOMNode();
            var itemsWidth = items.clientWidth;
            var mainWidth = main.clientWidth;
            var itemsCN = "items-larger";
            var mainButtonLargerCN = "main-button-larger";
            var mainButtonSmallerCN = "main-button-smaller";
            var leftTrans = 0;
            if (this.props.center) {
                itemsCN += "-center";
                mainButtonLargerCN += "-center";
            } else if (this.props.right) {
                itemsCN += "-right";
                mainButtonLargerCN += "-right";
            } else {
                itemsCN += "-left";
            }

            if (itemsWidth > mainWidth) {
                main.classList.remove(mainButtonLargerCN);
                main.classList.add(mainButtonSmallerCN);
                items.classList.add(itemsCN);
            } else if (itemsWidth < mainWidth) {
                main.classList.remove(mainButtonSmallerCN);
                items.classList.remove(itemsCN);
                main.classList.add(mainButtonLargerCN);
            }

            if (this.props.center) {
                items.style.left = -(itemsWidth - mainWidth) / 2 + 'px';
            } else if (this.props.right) {
                var hackDiff = 0;
                if (this.props.mid)
                    hackDiff = 1;
                items.style.left = -(itemsWidth - mainWidth - hackDiff) + 'px';
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
    hide: function() {
        this.setState({hidden: true});
    },
    render: function() {
        var that = this;
        var mainButton = function() {
            return (
                <Button ref="main" large={that.props.large}
                    selected={!that.state.hidden || that.props.selected}
                    mid={that.props.mid}
                    small={that.props.small}
                    addClass={that.state.hidden ?
                              "main-button "  +
                                 (that.props.addClass ? that.props.addClass : '') :
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
                if (callback)
                    callback();
            };
        };

        var items = !this.props.items ?
            [] :
            this.props.items.map(function(item, ind) {
                if (!item)
                    return null;

                if (item.hr) {
                    return (
                        <span key={ind} className="vspace">
                            <MenuHr text={item.text} key={ind}/>
                        </span>
                    );
                }
                if (item.items) {
                    return (
                        <span key={ind} className="vspace">
                            <ButtonMenu text={item.text} items={item.items}
                                icon={item.icon} />
                        </span>
                    );
                }
                var click = onClickWrapper(item.click);
                return (
                    <span key={ind} className="vspace">
                        <Button text={item.text} click={click}
                            addClass={item.addClass} icon={item.icon}
                            link={item.link} />
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
