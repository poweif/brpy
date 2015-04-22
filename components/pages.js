var ProjectListing = React.createClass({
    render: function() {
        var that = this;
        var ignore = this.props.ignore ? this.props.ignore : {};
        var deleteButton =
            this.props.publisher &&
            (this.props.publisher == this.props.loggedInUser) ?
            function() {
                return (
                    <Button tiny addClass="delete-button" icon="clear5"
                        click={that.props.onDeleteProject} />
                );
            }() : null;

        var publisher = ignore['publisher'] ? null : function() {
            var publisherName = SKG.util.trimUserName(that.props.publisher);
            return (
                <div className="block">
                    <div className="publisher">{publisherName}</div>
                </div>
            );
        }();
        var id = ignore['id'] ? null : function() {
            return <div className="id">{that.props.id}</div>;
        }();

        return (
            <div className="project-listing">
                <div className="top">
                    <div className="block">
                        <div className="title">
                            <a onClick={this.props.onGoToProject}>
                                {this.props.title}</a>
                            {deleteButton}
                        </div>
                        {id}
                    </div>
                    <div className="block">
                        <div className="time-stamp">
                            {this.props.stamp}
                        </div>
                   </div>
                   {publisher}
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
            content: null,
            projects: [],
            loading: true,
            isDialogOpen: false,
            solution: null
        };
    },
    onGoToProject: function(id) {
        var isPublished = this.props.user == SKG_USER_PUBLISHED;
        if (isPublished) {
            window.location.href = window.location.href + '#' + id;
        } else {
            window.location.href = 'http://' + window.location.host +
                '/#' + id;
        }
    },
    onDeleteProject: function(proj, alias) {
        var that = this;
        var writeUser = this.state.user == SKG_USER_PUBLISHED ?
            SKG_USER_PUBLISHER : this.state.user;
        var updateSol = function() {
            var nprojs = [];
            var sol = that.state.solution;
            sol['projects'].forEach(function(p) {
                if (p != proj)
                    nprojs.push(p);
            });
            sol['projects'] = nprojs;
            SKG.updateSolution(writeUser, sol, that.loadList);
            that.closeDialog();
        };
        var ok = function() {
            that.setState({projects: [], loading: true});
            SKG.deleteProject(writeUser, proj, updateSol);
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
                var title = pdata.alias;
                var id = ps[ind];
                var stamp = pdata.publishedTime;
                var publisher = pdata.publisher;
                var ignore = {};

                var isPublished = that.props.user == SKG_USER_PUBLISHED;

                if (!isPublished) {
                    id = ps[ind];
                    title = ps[ind];
                    publisher = that.props.user;
                    stamp = pdata.stamp;
                    del = function() {
                        that.onDeleteProject(title, title);
                    };
                    ignore = {'publisher': true, 'id': true};
                }

                var goTo = function() {
                    that.onGoToProject(id);
                };

                // Skip the default 'example' place-holder project.
                if ((isPublished && pdata.publisher) || !isPublished) {
                    that.state.projects.push(function() {
                        return (
                            <ProjectListing title={title} id={id}
                                onDeleteProject={del}
                                onGoToProject={goTo}
                                stamp={stamp} ignore={ignore} desc={pdata.desc}
                                loggedInUser={that.props.loggedInUser}
                                publisher={publisher} />
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
        this.loadList();
    },
    render: function() {
        var that = this;
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

        var isPublished = this.props.user == SKG_USER_PUBLISHED;
        var topInfo = null;
        var headerBar = null;

        if (isPublished) {
            topInfo = function() {
                return (
                    <span dangerouslySetInnerHTML={{__html: that.state.content}} />
                );
            }();
            headerBar = function() {
                return (
                    <HeaderBar isDialogOpen={that.state.isDialogOpen}
                        loggedInUser={that.props.loggedInUser}
                        user={that.props.user} />
                );
            }();
        } else {
            topInfo = function() {
                var userName = SKG.util.trimUserName(that.props.user);
                var str = userName + "'s projects";
                var funIcon = '/img/' + SKG.util.getFunIcon(that.props.user)
                    + '.png';
                return (
                    <div className="custom-top">
                        <img src={funIcon} />
                        <h1>{str}</h1>
                        <Button mid link="/logout" icon="back57" />
                    </div>
                );
            }();
            headerBar = function() {
                return <LogoMenu isDialogOpen={that.state.isDialogOpen} />;
            }();
        }

        return (
            <div className="projects-list-wrapper">
                {headerBar}
                <div className="projects-list">
                    {topInfo}
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
        if (this.state.user == SKG_USER_PUBLISHED &&
            !SKG.readProjectFromURL()) {
            content = function() {
                return (
                    <ProjectsList user={that.state.user}
                        loggedInUser={that.state.loggedInUser}
                        contentUrl="/content/published.md" />
                );
            }();
        } else if (this.state.user == SKG_USER_U) {
            if (that.state.loggedInUser) {
                content = function() {
                    return (
                        <ProjectsList user={that.state.loggedInUser}
                            loggedInUser={that.state.loggedInUser} />
                    );
                }();
            } else {
                window.location.href = '/' + SKG_URL_PATH_PUBLISHED;
            }
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
