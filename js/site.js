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
        }
    }
})();

