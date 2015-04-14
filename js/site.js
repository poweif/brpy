var SKG_DICT = function() {
    this.obj = {};
};

SKG_DICT.prototype.i = function(key, value) {
    this.obj[key] = value;
    return this;
};

SKG_DICT.prototype.o = function(key, value) {
    return this.obj;
};

var SKG = {
    util: {
        indexOf: function(list, elem) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] == elem)
                    return i;
            }
            return -1;
        },
        // http://stackoverflow.com/questions/1349404/
        // generate-a-string-of-5-random-characters-in-javascript
        makeId: function(len) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var nlen = len ? len : 24;
            for( var i=0; i < nlen; i++ )
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length));
            return text;
        },
        xhrGet: function(url, onLoad, onFailed) {
            console.log('making a request for ' + url);
            var contentReq = new XMLHttpRequest("a=b&c=d");
            var readyStateChange = function() {
                if (contentReq.readyState == 4 && contentReq.status == 200 &&
                    onLoad) {
                    onLoad(contentReq.responseText);
                } else if (contentReq.readyState == 4 && onFailed) {
                    onFailed(contentReq.status);
                }
            }
            contentReq.onreadystatechange = readyStateChange;
            contentReq.open('GET', url, true);
            contentReq.send()
        },
        xhrPost: function(url, text, onLoad, onFailed) {
            console.log('making a request for ' + url);
            var contentReq = new XMLHttpRequest();
            var readyStateChange = function() {
                if (contentReq.readyState == 4 && contentReq.status == 200 &&
                    onLoad) {
                    onLoad(contentReq.responseText);
                } else if (contentReq.readyState == 4 && onFailed) {
                    onFailed(contentReq.status);
                }
            }
            contentReq.onreadystatechange = readyStateChange;
            contentReq.open('POST', url, true);
            contentReq.send(text);
        },
        getFileName: function(fname) {
            if (fname.lastIndexOf('.') < 0)
                return null;
            return fname.substring(0, fname.lastIndexOf('.'));
        },
        getFileExt: function(fname) {
            var ind = fname.lastIndexOf('.');
            if (ind < 0 || ind >= fname.length - 1)
                return null;
            return fname.substring(ind + 1);
        },
        // http://stackoverflow.com/questions/10787782/
        // full-height-of-a-html-element-div-including-border-padding-and-margin
        fullElementHeight: function(e) {
            var elmHeight = 0;
            var elmMargin = 0;
            if (document.all) { // IE
                elmHeight = parseInt(e.currentStyle.height, 10);
                elmMargin = parseInt(e.currentStyle.marginTop, 10) +
                    parseInt(e.currentStyle.marginBottom, 10);
            }
            else { // Mozilla
                elmHeight = parseInt(document.defaultView.getComputedStyle(e, '')
                                     .getPropertyValue('height'));
                elmHeight = Math.max(e.getBoundingClientRect().height);
                elmMargin = parseInt(document.defaultView
                                     .getComputedStyle(e, '')
                                     .getPropertyValue('margin-top')) +
                    parseInt(document.defaultView.getComputedStyle(e, '')
                             .getPropertyValue('margin-bottom'));
            }
            return elmHeight + elmMargin;
        },
        deepCopy: function(obj) {
            if (typeof obj === "string" || typeof obj === "number" ||
                typeof obj === "boolean")
                return obj;

            if (obj.length !== undefined) {
                var ret = [];
                for (var i = 0; i < obj.length; i++)
                    ret.push(this.deepCopy(obj[i]));
                return ret;
            }

            var ret = {};
            for (var k in obj)
                ret[k] = this.deepCopy(obj[k]);
            return ret;
        },
        copyAndReplace: function(copy, obj, data) {
            var ret = copy(obj);
            for (var i in data) {
                ret[i] = data[i];
            }
            return ret;
        },
        softCopy: function(obj) {
            if (typeof obj === "string" || typeof obj === "number" ||
                typeof obj === "boolean")
                return obj;

            if (obj.length !== undefined) {
                return obj.map(function(o) {
                    return o;
                });
            }

            var ret = {};
            for (var k in obj)
                ret[k] = obj[k];
            return ret;
        }
    },
    d: function(key, val) {
        if (key)
            return (new SKG_DICT()).i(key, val);
        return new SKG_DICT();
    },
    readUserInfo: function(onLoad, onFailed) {
        this.util.xhrGet('/user', onLoad, onFailed);
    },
    determineUser: function(userName) {
        var dirs = window.location.pathname.split('/');
        if (dirs.length < 2)
            return userName;
        if (dirs[1] == SKG_URL_PATH_START)
            return null;
        if (dirs[1] == SKG_URL_PATH_PUBLISHED)
            return 'published';
        return userName;
    },
    apiPrefix: function(user) {
        if (!user || user == SKG_USER_START)
            return '/' + SKG_URL_PATH_START;
        if (user == SKG_USER_PUBLISHED)
            return '/' + SKG_URL_PATH_PUBLISHED;
        return '';
    },
    readSolution: function(user, onLoad, onFailed) {
        this.util.xhrGet(
            this.apiPrefix(user) + '/run?solution', onLoad, onFailed);
    },
    exportProject: function(proj, onLoad, onFailed) {
        var data = JSON.stringify(proj);
        this.util.xhrPost('/export', data, onLoad, onFailed);
    },
    importProject: function(user, onLoad, onFailed) {
        this.util.xhrGet(
            this.apiPrefix(user) + '/run?import-proj', onLoad, onFailed);
    },
    init: function(user, onLoad, onFailed) {
        this.util.xhrGet(this.apiPrefix(user) + '/run?init', onLoad, onFailed);
    },
    updateSolution: function(user, solData, onLoad, onFailed) {
        var solDataStr = JSON.stringify(solData)
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?update-solution', solDataStr, onLoad,
            onFailed);
    },
    readProject: function(user, proj, onLoad, onFailed) {
        this.util.xhrGet(
            this.apiPrefix(user) + '/run?read-proj=' + proj, onLoad, onFailed);
    },
    writeProject: function(user, proj, projData, onLoad, onFailed) {
        var projDataStr = JSON.stringify(projData);
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?write-proj=' + proj, projDataStr,
            onLoad, onFailed);
    },
    renameProject: function(user, oldName, newName, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?rename-proj=' + oldName + ','
                + newName,
            null, onLoad, onFailed);
    },
    newProject: function(user, proj, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?new-proj=' + proj, null, onLoad,
            onFailed);
    },
    deleteProject: function(user, proj, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?delete-proj=' + proj, null, onLoad,
            onFailed);
    },
    renameSrcFile: function(user, proj, oldname, newname, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?rename=' +
                oldname + "," + newname + '&proj=' + proj,
            null, onLoad, onFailed);
    },
    deleteSrcFile: function(user, proj, filename, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?delete=' + filename + '&proj=' + proj,
            null, onLoad, onFailed);
    },
    readSrcFile: function(user, proj, filename, onLoad, onFailed) {
        this.util.xhrGet(
            this.apiPrefix(user) + '/run?read=' + filename + '&proj=' + proj,
            onLoad, onFailed);
    },
    writeSrcFile: function(user, proj, filename, text, onLoad, onFailed) {
        this.util.xhrPost(
            this.apiPrefix(user) + '/run?write=' + filename + '&proj=' + proj,
            text, onLoad, onFailed);
    },
    openDialog: function(text, choices, prompt, onOK, onCancel) {
        this.closeDialog();
        SKG.openedDialog = React.render(
            <InputDialog text={text} choices={choices} prompt={prompt}
                onOK={onOK} onCancel={onCancel} />,
            document.getElementById('dialog0'));
    },
    loadingDialog: function() {
        if (SKG.openedDialog && SKG.openedDialog.reopen) {
            SKG.openedDialog.reopen();
            return;
        }
        SKG.openedDialog = React.render(
            <LoadingDialog />, document.getElementById('dialog0'));
    },
    closeDialog: function() {
        if (!SKG.openedDialog)
            return;
        var onfinish = function() {
            React.unmountComponentAtNode(document.getElementById('dialog0'));
            SKG.openedDialog = null;
        };
        SKG.openedDialog.close(onfinish);
    },
    builtinRead: function(x) {
        if (Sk.builtinFiles === undefined ||
            Sk.builtinFiles["files"][x] === undefined) {
            throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
    },
    readProjectFromURL: function() {
        var url = window.location.href;
        if (url.lastIndexOf('#') < 0)
            return null;

        return url.substring(url.lastIndexOf('#') + 1)
    },
    updateURLWithProject: function(proj) {
        var url = window.location.href;

        var urlPre = (url.indexOf('#') >= 0) ?
            url.substring(0, url.indexOf('#')) :
            url;

        url = urlPre + (urlPre[urlPre.length - 1] == '/' ? '#' : '/#') + proj;
        window.history.replaceState(null, null, url);
    },
    updateTitleWithUserProject: function(user, proj) {
        if (user) {
            document.title = SKG_TITLE + ' :: ' + user + ' :: ' + proj;
            return;
        }
        document.title = SKG_TITLE + ' :: ' + proj;
    },
    updateWithUserProject: function(user, proj) {
        this.updateURLWithProject(proj);
        this.updateTitleWithUserProject(user, proj);
    }
};

(function() {
    // Site-wide constants
    SKG_TITLE = 'brpy';
    SKG_BLOCK_NAME = 'name';
    SKG_BLOCK_SRC = 'src';
    SKG_BLOCK_CURRENT_FILE = 'currentFile';
    SKG_BLOCK_COLLAPSED = "collapsed";
    SKG_BLOCK_DISPLAY = "display";
    SKG_FILE_NAME = "file";
    SKG_FILE_HEIGHT = "height";
    SKG_FILE_OFFSET_Y = "offsetY";
    SKG_SOLUTION_PROJECTS = 'projects';
    SKG_SOLUTION_CURRENT_PROJECT = 'currentProject';
    SKG_SOLUTION_EDITOR_MODE = 'editorMode';
    SKG_EDITOR_STANDARD = 'default';
    SKG_EDITOR_EMACS = 'emacs';
    SKG_DEEP_COPY = SKG.util.deepCopy;
    SKG_SOFT_COPY = SKG.util.softCopy;
    SKG_INIT_LOAD_SOLUTION = 'INIT_LOAD_SOLUTION';
    SKG_INIT_IMPORT_PROJECT = 'INIT_IMPORT_PROJECT';
    SKG_URL_PATH_START = 'start';
    SKG_URL_PATH_PUBLISHED = 'published';
    SKG_USER_START = 'start';
    SKG_USER_PUBLISHED = 'published';

    window.addEventListener("beforeunload", function (e) {
        var confirmation = "Did you save? Are you sure you'd like to quit?"
        (e || window.event).returnValue = confirmation;
        return confirmation;
    });

    SKG.openedDialog = null;

    SKG.fun = ['albatross', 'amago', 'anis', 'antelope1', 'avocet', 'bandicoot', 'bear13', 'beaver', 'beaver1', 'bird46', 'bird47', 'bird48', 'bird50', 'bird51', 'bird52', 'bird53', 'bird54', 'bird55', 'bird56', 'bird57', 'bird58', 'bird61', 'buffalo1', 'bull8', 'camel1', 'camel2', 'centrosaurus', 'chameleon1', 'cheetah1', 'chinchilla1', 'cow9', 'crocodile1', 'deer2', 'deer3', 'deer4', 'deer5', 'dinosaur13', 'dinosaur4', 'dinosaur8', 'dog58', 'dogfish', 'dolphin', 'domestic', 'elephant6', 'eromangasaurus', 'falcon', 'fish25', 'fish29', 'fish31', 'fish32', 'fish33', 'fish36', 'fish40', 'fish42', 'flamingo3', 'flying14', 'fox1', 'frigatebird', 'frog5', 'gazelle', 'gecko2', 'giraffatitan', 'giraffe3', 'gorgosaurus', 'gull', 'hammerhead', 'hawk', 'hippo2', 'horse176', 'horse177', 'hummingbird', 'humpback', 'hyena', 'iguana', 'kangaroo', 'koala', 'lamb', 'lemur', 'magyarosaurus', 'mamenchisaurus', 'mammal5', 'mammal6', 'mammal7', 'mammut', 'manatee', 'manta', 'monkey2', 'monkey3', 'monoclonius', 'moose2', 'mouse37', 'mouse38', 'opah', 'opossum', 'orca', 'owl13', 'oystercatcher', 'panther', 'parrot', 'pelican', 'pig4', 'pigeon', 'porcupine2', 'prairie', 'pterodactyl', 'puma', 'quail', 'rabbit5', 'racoon1', 'rat2', 'rhino', 'right102', 'running28', 'running29', 'sandpiper', 'sea11', 'seahorse1', 'shark1', 'sheep3', 'snail1', 'squirrel3', 'swallow', 'swift', 'tapir', 'tiger3', 'tropical2', 'turkey6', 'turtle', 'turtle1', 'tyrannosaurus1', 'tyrannosaurus2', 'velociraptor', 'vulture', 'wallaby', 'whale1', 'wild4', 'wombat', 'yellowtail'];
})();
