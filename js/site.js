var skulptgl = {
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
        xhrGet: function(url, onLoad, onFailed) {
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
            contentReq.open('GET', url, true);
            contentReq.send();
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
            if (fname.indexOf('.') < 0)
                return null;
            return fname.substring(0, fname.indexOf('.'));
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
        }
    },
    readSolution: function(onLoad, onFailed) {
        this.util.xhrGet('/run/?solution', onLoad, onFailed);
    },
    readProject: function(proj, onLoad, onFailed) {
        this.util.xhrGet('/run/?proj=' + proj, onLoad, onFailed);
    },
    writeProject: function(newProj, onLoad, onFailed) {
        var newProjStr = JSON.stringify(newProj);
        this.util.xhrPost('/run/?write-proj', newProjStr, onLoad, onFailed);
    },
    renameProject: function(newProjName, onLoad, onFailed) {
        this.util.xhrGet('/run/?rename-proj=' + newProjName, onLoad, onFailed);
    },
    newProject: function(projName, onLoad, onFailed) {
        this.util.xhrGet('/run/?new-proj=' + projName, onLoad, onFailed);
    },
    deleteProject: function(proj, onLoad, onFailed) {
        this.util.xhrGet('/run/?delete-proj=' + proj, onLoad, onFailed);
    },
    renameSrcFile: function(oldname, newname, onLoad, onFailed) {
        this.util.xhrGet(
            '/run/?rename=' + oldname + "," + newname, onLoad, onFailed);
    },
    deleteSrcFile: function(filename, onLoad, onFailed) {
        this.util.xhrGet('/run/?delete=' + filename, onLoad, onFailed);
    },
    readSrcFile: function(filename, onLoad, onFailed) {
        this.util.xhrGet('/run/?read=' + filename, onLoad, onFailed);
    },
    writeSrcFile: function(filename, text, onLoad, onFailed) {
        this.util.xhrPost('/run/?write=' + filename, text, onLoad, onFailed);
    },
    openDialog: function(text, prompt, onOK, onCancel) {
        this.closeDialog();
        React.render(
            <InputDialog text={text} prompt={prompt} onOK={onOK}
                onCancel={onCancel} />,
            document.getElementById('dialog0'));
    },
    closeDialog: function() {
        React.unmountComponentAtNode(
            document.getElementById('dialog0'));
    },
    builtinRead: function(x) {
        if (Sk.builtinFiles === undefined ||
            Sk.builtinFiles["files"][x] === undefined) {
            throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
    },
    project: null,
};

(function() {
    // Site-wide constants
    SKULPTGL_PROJECT_NAME = 'name';
    SKULPTGL_PROJECT_SRC = 'src';
    SKULPTGL_PROJECT_DEFAULT_FILE = 'defaultFile';

    window.addEventListener("beforeunload", function (e) {
        var confirmation = "Did you save? Are you sure you'd like to quit?"
        (e || window.event).returnValue = confirmation;
        return confirmation;
    });
})();
