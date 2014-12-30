var skulptgl = {
    xhrGet: function(url, onLoad) {
        console.log('making a request for ' + url);
        var contentReq = new XMLHttpRequest();
        var readyStateChange = function() {
            if (contentReq.readyState == 4) {
                onLoad(contentReq.responseText);
            }
        }
        contentReq.onreadystatechange = readyStateChange;
        contentReq.open('GET', url, true);
        contentReq.send();
    },
    xhrPost: function(url, text, onLoad) {
        console.log('making a request for ' + url);
        var contentReq = new XMLHttpRequest();
        var readyStateChange = function() {
            if (contentReq.readyState == 4) {
                onLoad(contentReq.responseText);
            }
        }
        contentReq.onreadystatechange = readyStateChange;
        contentReq.open('POST', url, true);
        contentReq.send(text);
    },
    readProject: function(onLoad) {
        this.xhrGet('/run/?proj', onLoad);
    },
    readSrcFile: function(filename, onLoad) {
        this.xhrGet('/run/?read='+filename, onLoad);
    },
    writeSrcFile: function(filename, text, onFinished) {
        this.xhrPost('/run/?write='+filename, text, onFinished);
    },
    openProjectDialog: function(project) {
        React.render(<ProjectDialog proj={project} />,
                     document.getElementById('project-dialog'));
    },
    closeProjectDialog: function() {
        React.unmountComponentAtNode(
            document.getElementById('project-dialog'));
    },
    util: null
};

(function() {
    skulptgl.util = {
        indexOf: function(list, elem) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] == elem)
                    return i;
            }
            return -1;
        },
        // http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
        makeId: function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for( var i=0; i < 24; i++ )
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length));
            return text;
        }
    }
})();
