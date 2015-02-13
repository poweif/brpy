var Button =  React.createClass({
    render: function() {
        var that = this;
        var imgClassName = ""
        var textClassName = "button-text";

        if (this.props.large) {
            imgClassName += " button-large";
            textClassName += " font-large";
        } else if (this.props.mid) {
            imgClassName += " button-mid";
            textClassName += " font-mid";
        } else {
            imgClassName += " button-small";
            textClassName += " font-small";
        }

        if (this.props.selected) {
            imgClassName += " button-selected";
        }


        var buttonText = !that.props.text ? null : function() {
            return (
                <div className={textClassName}>{that.props.text}</div>
            );
        }();

        var img = !this.props.icon ? null : function() {
            var imgSrc = "/img/" + that.props.icon + ".png";
            var click = that.props.click;
            var nclassName = imgClassName;
            if (!buttonText) {
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

        var wrapperClassName = "button-wrapper";
        if (this.props.selected)
            wrapperClassName += " button-selected";

        if (this.props.addClass)
            wrapperClassName += " " + that.props.addClass;

        return (
                <div className={wrapperClassName} onClick={this.props.click}>
                {this.props.rev ? buttonText : img}
                {this.props.rev ? img : buttonText}
            </div>
        );
    }
});

var ButtonMenu =  React.createClass({
    getInitialState: function() {
        return {
            hidden: true,
        };
    },
    onClickMain: function () {
        this.setState({hidden: !this.state.hidden});
    },
    render: function() {
        var that = this;
        var mainButton = function() {
            return (
                <Button rev large={that.props.large}
                    selected={!that.state.hidden}
                    mid={that.props.mid}
                    small={that.props.small}
                    addClass="main-button"
                    click={that.onClickMain} text={that.props.text}
                    icon={that.props.icon} />
            );
        }();

        var buttonMenuClassName = "button-menu";

        if (this.state.hidden)
            return mainButton;

        if (this.props.center) {
            buttonMenuClassName += " button-menu-center";
        } else if (this.props.right) {
            buttonMenuClassName += " button-menu-right";
        }

        var items = !this.props.items ?
            null :
            this.props.items.map(function(item) {
                return (
                    <Button text={item.text} click={item.click}
                        icon={item.icon} />
                );
            });

        return (
            <div className={buttonMenuClassName}>
                {mainButton}
                <div className="items">
                    {items}
                </div>
            </div>
        );
    }
});
