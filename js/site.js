var skulptgl = {
    xhr: function(url, onLoad) {
        var contentReq = new XMLHttpRequest();
        contentReq.onload = onLoad;
        contentReq.open('GET', url, true);
        contentReq.send();
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

