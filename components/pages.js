var ProjectListing = React.createClass({
    render: function() {
        return (
            <div className="project-listing">
                <div className="top">
                    <div className="block">
                        <div>{this.props.alias}</div>
                        <div className="id">{this.props.id}</div>
                    </div>
                    <div className="block">
                        <div>{this.props.publisher}</div>
                        <div>{this.props.time}</div>
                    </div>
                </div>
                <div className="desc"></div>
            </div>
        );
    }
});

var ProjectsList = React.createClass({
    getInitialState: function() {
        return {
            content: "hey ma look no hands",
            projects: []
        };
    },
    componentDidMount: function() {
        var that = this;
        if (this.props.contentUrl) {
            var onLoad = function(text) {
                that.setState({
                    content: kramed(text)
                });
            };
            SKG.util.xhrGet(this.props.contentUrl, onLoad, null);
        }
        if (this.props.user == SKG_USER_PUBLISHED) {
            var readOneProject = function(ps, ind) {
                if (ind == ps.length)
                    return;
                var onDone = function(text) {
                    var pdata = JSON.parse(text);
                    that.state.projects.push(function() {
                        return (
                            <ProjectListing alias={pdata.alias}
                                id={ps[ind]} time={pdata.publishedTime}
                                publisher={pdata.publisher} />
                        );
                    }());
                    that.setState({ projects: that.state.projects });
                    readOneProject(ps, ind + 1);
                };
                SKG.readProject(that.props.user, ps[ind], onDone);
            };

            var onLoad = function(text) {
                var sol = JSON.parse(text);
                var projects = sol.projects;
                readOneProject(sol.projects, 0);
            };
            SKG.readSolution(this.props.user, onLoad, null);
        }
    },
    render: function() {
        var projectsList = this.state.projects.map(
            function(project) {
                return <div>{project}</div>;
            }
        );
        return (
           <div className="main-panel">
               <span dangerouslySetInnerHTML={{__html: this.state.content}} />
               {projectsList}
           </div>
        );
    }
});

var TheHub = React.createClass({
    getInitialState: function() {
        return {
            user: null
        };
    },
    componentDidMount: function() {
        var that = this;
        var onLoad = function(userInfo) {
            var user = null;
            if (userInfo) {
                user = SKG.determineUser(JSON.parse(userInfo)['email']);
            } else {
                user = SKG.determineUser(null);
            }
            that.setState({user: user});
        };
        var onFail = function() {
            console.log('failed to read user info');
        };
        SKG.readUserInfo(onLoad, null);
    },
    render: function() {
        var that = this;
        var content = null;
        if (this.state.user == SKG_USER_PUBLISHED &&
            !SKG.readProjectFromURL()) {
            content = function() {
                return (
                    <ProjectsList user={that.state.user}
                        contentUrl="/content/published.md" />
                );
            }();
        } else {
            content = function() {
                return <Worksheet user={that.state.user} />;
            }();
        }

        return (
            <div>
                {content}
                <Footer />
            </div>
        );
    }
});
