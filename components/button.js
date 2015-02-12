var Button =  React.createClass({
    render: function() {
        var that = this;
        var img = !this.props.icon ? null : function() {
            var imgSrc = "/img/" + that.props.icon + ".png";
            return (
                <img src={imgSrc} className="button" />
            );
        }();
        var buttonText = !that.props.text ? null : function() {
            return (
                <div className="button-text">that.props.text</div>
            );
        }();
        return (
            <div className="button-wrapper">
                {img}
                {buttonText}
            </div>
        );
    }
});
