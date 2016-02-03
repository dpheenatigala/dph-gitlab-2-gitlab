(function(){

    var config = require('./config');

    var clc = require('cli-color');
    var error = clc.red.bold;
    var warn = clc.yellow;
    var notice = clc.blue;

    var gitlab = require('gitlab');

    var fromgitlab = gitlab({
        url:   config.from.baseurl,
        token: config.from.token,
    });

    var togitlab = gitlab({
        url:   config.to.baseurl,
        token: config.to.token,
    });

    function checkUserAccess() {
        fromgitlab.users.current(function(user){
            if (!user.is_admin) {
                console.log(warn("From gitlab user is not an admin. Functionality will be limited."));
            } else {
                getAccessToGroups(fromgitlab, user, function(data){
                    console.log(data);
                });
            }
        });

        // togitlab.users.current(function(user){
        //     if (!user.is_admin) {
        //         console.log(warn("To gitlab user is not an admin. Functionality will be limited."));
        //     } else {
        //         getAccessToGroups(togitlab, user, function(data){
        //             console.log(data);
        //         });
        //     }
        // });
    }

    function getAccessToGroups(gitlab, user, callback) {
        gitlab.groups.all(function(groups){
            for(var i=0; i < groups.length; i++) {
                group = groups[i];
                getAccessToGroup(gitlab, group, user, callback);
            }           
        });        
    }

    function getAccessToGroup(gitlab, group, user, callback) {
        gitlab.groups.listMembers(group.id, function(users){
            var found = false;
            for(var i=0; i < users.length; i++) {
                if (users[i].id == user.id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                gitlab.groups.addMember(
                    group.id,
                    user.id,
                    gitlab.groups.access_levels['OWNER'],
                    function(data) {
                        callback(data);
                    }
                );
            }
        });
    }

    require('./server')(function(req, res){
        console.log(req.jsonpost);
        
        checkUserAccess();
        
        // fromgitlab.projects.all(function(projects) {
        //     console.log(projects);
        // });

    }, config.port);

}).call(this);