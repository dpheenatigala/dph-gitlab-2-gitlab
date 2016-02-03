(function(){

    var Access = function () {};

    Access.prototype.checkUserAccess = function(gitlab, callback) {
        gitlab.users.current(function(user) {
            if (!user.is_admin) {
                console.log(user.name + " is not an admin.")
                callback(user, false);
            } else {
                console.log(user.name + " is an admin.")
                callback(user, true);
            }
        });
    }

    Access.prototype.getAccessToGroups = function (gitlab, user, callback) {
        var that = this;
        gitlab.groups.all(function(groups){
            for(var i=0; i < groups.length; i++) {
                group = groups[i];
                that.getAccessToGroup(gitlab, group, user, function(group) {
                    callback(group);
                });
            }           
        });
    }

    Access.prototype.getAccessToGroup = function (gitlab, group, user, callback) {
        gitlab.groups.listMembers(group.id, function(users){
            var found = false;
            for(var i=0; i < users.length; i++) {
                if (users[i].id == user.id) {
                    found = true;
                    callback(group);
                    break;
                }
            }
            if (!found) {
                gitlab.groups.addMember(
                    group.id,
                    user.id,
                    gitlab.groups.access_levels['OWNER'],
                    function(data) {
                        callback(group);
                    }
                );
            }
        });
    }

    Access.prototype.checkIfGroupAvailable = function (gitlab, grouptofind, callback) {
        gitlab.groups.all(function(groups){
            var found = false;
            for(var i=0; i < groups.length; i++) {
                group = groups[i];
                if ( group.path == grouptofind.path ) {
                    callback(group);
                    found = true;
                    break;
                }
            }
            if (!found) {
                callback(false);
            }
        });
    }

    Access.prototype.createGroup = function (gitlab, grouptocreate, callback) {
        var that = this;
        that.checkIfGroupAvailable(gitlab, grouptocreate, function(found) {
            if (!found) {
                that.checkUserAccess(gitlab, function(user, is_admin){
                    if (!user.can_create_group) {
                        console.log(user.name + ' cannot create groups');    
                    } else {
                        gitlab.groups.create({
                            name : grouptocreate.name,
                            path : grouptocreate.path,
                            description : grouptocreate.description,
                        }, function(data) {
                            callback(data);
                        });
                    }
                });
            } else {
                console.log(grouptocreate.name + ' is already available.');
                callback(true);
            }
        });
    }

    module.exports = new Access();

})();