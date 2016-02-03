(function(){

    var config = require('./config');

    var gitlab = require('gitlab');

    var fromgitlab = gitlab({
        url:   config.from.baseurl,
        token: config.from.token,
    });

    var togitlab = gitlab({
        url:   config.to.baseurl,
        token: config.to.token,
    });

    var access = require('./access');

    function getAccess(fromgitlab, togitlab) {
        access.checkUserAccess(fromgitlab, function(user, is_admin){
            if (!is_admin) {
                console.log(user.name + ' user is not an admin. Functionality will be limited');
            }

            access.getAccessToGroups(fromgitlab, user, function(group) {
                access.createGroup(togitlab, group, function(data) {
                    console.log('create group callback start');
                    console.log(data);
                    console.log('create group callback end');
                });
            });
            
        });
    }

    require('./server')(function(req, res){
        console.log(req.jsonpost);
        
        getAccess(fromgitlab, togitlab);

        if (config.bidirectional) {
            getAccess(togitlab, fromgitlab);
        }

    }, config.port);

}).call(this);