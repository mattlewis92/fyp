angular
    .module('fyp.services')
    .service('UserManager', ['$rootScope', '$state', function ($rootScope, $state) {

        var self = this;

        this.users = [];

        this.totalUsersLoaded = 0;

        this.addUser = function(user) {
            self.users.push(user);
        }

        this.removeUser = function(user) {
            angular.forEach(self.users, function(otherUser, index) {
                if (user == otherUser) self.users.splice(index, 1);
            });
        }

        $rootScope.$watch(function() {
            return self.totalUsersLoaded;
        }, function (newValue) {
            if (newValue == self.users.length && self.users.length > 0) {
                $state.go('app.viewUsers');
            }
        });

        this.lookupAllUsers = function() {
            self.totalUsersLoaded = 0;
            $state.go('app.lookupUsers');
            self.users.forEach(function(user) {
                user.lookup();
            });
        }

        this.lookupUser = function(user) {
            self.totalUsersLoaded--;
            $state.go('app.lookupUsers');
            user.lookup();
        }

    }]);