(function(){
    const http = require('http');
    const url = require('url');

    function safeJSONparse(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return { "error" : "invalid json", "data" : data }
        }
    }

    function processJSONPost(req, res, callback) {
        var queryData = "";
        if(typeof callback !== 'function') return null;

        if(req.method == 'POST') {
            req.on('data', function(data) {
                queryData += data;
                if(queryData.length > 1e6) {
                    queryData = '{error:"Request Entity Too Large"}';
                    res.writeHead(413, {'Content-Type': 'text/plain'}).end();
                    req.connection.destroy();
                }
            });

            req.on('end', function() {
                req.jsonpost = safeJSONparse(queryData);
                callback();
            });

        } else {
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end();
        }
    }

    module.exports = function(callback, port) {
        http.createServer(function (req, res) {
            if (req.method == 'POST') {
                processJSONPost(req, res, function(){
                    callback(req, res);
                    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                    res.end();
                });
            } else {
                var url_parts = url.parse(req.url);
                res.writeHead(405, {'Content-Type': 'text/plain'});
                res.end();
            }
        }).listen(port);
    }

}).call(this);