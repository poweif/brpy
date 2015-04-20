var ProjectListing = React.createClass({
    goToProject: function() {
        window.location.href = window.location.href + '#' +
            this.props.id;
    },
    render: function() {
        var link = "/published/#" + this.props.id;
        var publisherName = SKG.util.trimUserName(this.props.publisher);
        var that = this;
        var deleteButton =
            this.props.publisher &&
            (this.props.publisher == this.props.loggedInUser) ?
            function() {
                return (
                    <Button tiny addClass="delete-button" icon="clear5"
                        click={that.props.onDeleteProject} />
                );
            }() : null;

        return (
            <div className="project-listing">
                <div className="top">
                    <div className="block">
                        <div className="title">
                            <a onClick={this.goToProject}>
                                {this.props.alias}</a>
                            {deleteButton}
                        </div>
                        <div className="id">{this.props.id}</div>
                    </div>
                    <div className="block">
                        <div className="time-stamp">
                            {this.props.stamp}
                        </div>
                    </div>
                    <div className="block">
                        <div className="publisher">
                            {publisherName}</div>
                    </div>
                </div>
                <div className="desc">{this.props.desc}</div>
            </div>
        );
    }
});

var ProjectsList = React.createClass({
    mixins: [DialogMixins(function(v) {
        this.setState({isDialogOpen: v})
    })],
    getInitialState: function() {
        return {
            content: "hey ma look no hands",
            projects: [],
            loading: true,
            isDialogOpen: false,
            solution: null
        };
    },
    onDeleteProject: function(proj, alias) {
        var that = this;
        var updateSol = function() {
            var nprojs = [];
            var sol = that.state.solution;
            sol['projects'].forEach(function(p) {
                if (p != proj)
                    nprojs.push(p);
            });
            sol['projects'] = nprojs;
            SKG.updateSolution(SKG_USER_PUBLISHER, sol, that.loadList);
            that.closeDialog();
        };
        var ok = function() {
            that.setState({projects: [], loading: true});
            SKG.deleteProject(SKG_USER_PUBLISHER, proj, updateSol);
        };
        this.openBinaryDialog(
            "Really delete project " + alias + "?", ok);
    },
    loadList: function() {
        var that = this;
        var readOneProject = function(ps, ind) {
            if (ind == ps.length) {
                that.setState({loading: false});
                return;
            }
            var onDone = function(text) {
                var pdata = JSON.parse(text);
                var del = function() {
                    that.onDeleteProject(ps[ind], pdata.alias);
                };
                // Skip the default 'example' place-holder project.
                if (pdata.publisher) {
                    that.state.projects.push(function() {
                        return (
                            <ProjectListing alias={pdata.alias}
                                onDeleteProject={del} desc={pdata.desc}
                                id={ps[ind]} stamp={pdata.publishedTime}
                                loggedInUser={that.props.loggedInUser}
                                publisher={pdata.publisher} />
                        );
                    }());
                }
                that.setState({ projects: that.state.projects });
                readOneProject(ps, ind + 1);
            };
            var onFail = function() {
                console.log("failed to read: " + ps[ind]);
                readOneProject(ps, ind + 1);
            };
            SKG.readProject(that.props.user, ps[ind], onDone, onFail);
        };

        var onLoad = function(text) {
            var sol = JSON.parse(text);
            var projects = sol.projects;
            that.setState({loading: true, solution: sol});
            readOneProject(sol.projects, 0);
        };
        SKG.readSolution(this.props.user, onLoad, null);
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
            this.loadList();
        }
    },
    render: function() {
        var projectsList = this.state.projects.map(
            function(project, ind) {
                return <div key={ind}>{project}</div>;
            }
        );
        var loader = function() {
            return (
                <div className="loader-wrapper">
                    <Loader size="30" color="#888888" />
                </div>
            );
        }();
        return (
           <div className="projects-list-wrapper">
               <HeaderBar isDialogOpen={this.state.isDialogOpen}
                   loggedInUser={this.props.loggedInUser}
                   user={this.props.user} />
               <div className="projects-list">
                   <span dangerouslySetInnerHTML={{__html: this.state.content}} />
                   {projectsList}
                   {this.state.loading ? loader: null}
               </div>
           </div>
        );
    }
});

var Footer = React.createClass({
    render: function() {
        return (
            <div className="footer">
                <span><span className="product">brpy</span> copyright 2015 </span>
                <span>icons designed by Freepik and Google</span>
            </div>
        );
    }
});

var TheHub = React.createClass({
    getInitialState: function() {
        return {
            user: null,
            loggedInUser: null
        };
    },
    hashChanged: function() {
        React.unmountComponentAtNode(document.getElementById('hub'));
        React.render(<TheHub />, document.getElementById('hub'));
    },
    componentDidMount: function() {
        var that = this;
        var onLoad = function(userInfo) {
            var user = null;
            var loggedInUser = null;
            if (userInfo) {
                loggedInUser = JSON.parse(userInfo)['email'];
                user = SKG.determineUser(loggedInUser);
            } else {
                user = SKG.determineUser(null);
            }
            that.setState({user: user, loggedInUser: loggedInUser});
        };
        var onFail = function() {
            console.log('failed to read user info');
        };
        SKG.readUserInfo(onLoad, null);

        window.addEventListener("hashchange", this.hashChanged, false);
    },
    componentWillUnmount: function() {
        window.removeEventListener("hashchange", this.hashChanged);
    },
    render: function() {
        var that = this;
        var content = null;
        console.log(that.state.loggedInUser);
        if (this.state.user == SKG_USER_PUBLISHED &&
            !SKG.readProjectFromURL()) {
            content = function() {
                return (
                    <ProjectsList user={that.state.user}
                        loggedInUser={that.state.loggedInUser}
                        contentUrl="/content/published.md" />
                );
            }();
        } else {
            content = function() {
                return (
                    <Worksheet user={that.state.user}
                        loggedInUser={that.state.loggedInUser} />
                );
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
