var skulptgl = {
    xhr: function(url, onLoad) {
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
    readProject: function(onLoad) {
        this.xhr('/run/?proj', onLoad);
    },
    readSrcFile: function(filename, onLoad) {
        this.xhr('/run/?read='+filename, onLoad);
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

