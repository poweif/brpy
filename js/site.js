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
    readSolution: function(onLoad, onFailed) {
        this.util.xhrGet('/run?solution', onLoad, onFailed);
    },
    updateSolution: function(solData, onLoad, onFailed) {
        var solDataStr = JSON.stringify(solData)
        this.util.xhrPost(
            '/run?update-solution', solDataStr, onLoad, onFailed);
    },
    readProject: function(proj, onLoad, onFailed) {
        this.util.xhrGet('/run?read-proj=' + proj, onLoad, onFailed);
    },
    writeProject: function(proj, projData, onLoad, onFailed) {
        var projDataStr = JSON.stringify(projData);
        this.util.xhrPost(
            '/run?write-proj=' + proj, projDataStr, onLoad, onFailed);
    },
    renameProject: function(oldName, newName, onLoad, onFailed) {
        this.util.xhrPost(
            '/run?rename-proj=' + oldName + ',' + newName, null, onLoad,
            onFailed);
    },
    newProject: function(proj, onLoad, onFailed) {
        this.util.xhrPost('/run?new-proj=' + proj, null, onLoad, onFailed);
    },
    deleteProject: function(proj, onLoad, onFailed) {
        this.util.xhrPost('/run?delete-proj=' + proj, null, onLoad, onFailed);
    },
    renameSrcFile: function(proj, oldname, newname, onLoad, onFailed) {
        this.util.xhrPost(
            '/run?rename=' + oldname + "," + newname + '&proj=' + proj, null,
            onLoad, onFailed);
    },
    deleteSrcFile: function(proj, filename, onLoad, onFailed) {
        this.util.xhrPost('/run?delete=' + filename + '&proj=' + proj, null,
                         onLoad, onFailed);
    },
    readSrcFile: function(proj, filename, onLoad, onFailed) {
        this.util.xhrGet('/run?read=' + filename + '&proj=' + proj,
                         onLoad, onFailed);
    },
    writeSrcFile: function(proj, filename, text, onLoad, onFailed) {
        this.util.xhrPost('/run?write=' + filename + '&proj=' + proj,
                          text, onLoad, onFailed);
    },
    openDialog: function(text, prompt, onOK, onCancel) {
        this.closeDialog();
        React.render(
            <InputDialog text={text} prompt={prompt} onOK={onOK}
                onCancel={onCancel} />,
            document.getElementById('dialog0'));
    },
    closeDialog: function() {
        React.unmountComponentAtNode(document.getElementById('dialog0'));
    },
    builtinRead: function(x) {
        if (Sk.builtinFiles === undefined ||
            Sk.builtinFiles["files"][x] === undefined) {
            throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
    }
};

(function() {
    // Site-wide constants
    SKG_BLOCK_NAME = 'name';
    SKG_BLOCK_SRC = 'src';
    SKG_BLOCK_CURRENT_FILE = 'currentFile';
    SKG_BLOCK_COLLAPSED = "collapsed";
    SKG_FILE_NAME = "file";
    SKG_FILE_HEIGHT = "height";
    SKG_SOLUTION_PROJECTS = 'projects';
    SKG_SOLUTION_CURRENT_PROJECT = 'currentProject';
    SKG_DEEP_COPY = SKG.util.deepCopy;
    SKG_SOFT_COPY = SKG.util.softCopy;

    window.addEventListener("beforeunload", function (e) {
        var confirmation = "Did you save? Are you sure you'd like to quit?"
        (e || window.event).returnValue = confirmation;
        return confirmation;
    });
})();
