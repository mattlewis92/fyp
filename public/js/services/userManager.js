angular
    .module('fyp.services')
    .service('userManager', ['$rootScope', '$state', function ($rootScope, $state) {

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
            var users = angular.copy(self.users);
            var maxToProcess = 5;

            var lookupUser = function() {
                if (users.length > 0) {
                    console.log('Looking up user1');
                    var user = users.pop();
                    user.lookup().then(lookupUser);
                }
            }

            for (var i = 0; i < maxToProcess; i++) {
                lookupUser();
            }

        }

        this.lookupUser = function(user) {
            self.totalUsersLoaded--;
            $state.go('app.lookupUsers');
            user.lookup();
        }

        this.removeUsersWithNoProfilesFound = function() {

            var newUsers = self.users.filter(function(user) {
               return user.hasFoundProfileData();
            });

            var removedCount = self.users.length - newUsers.length;

            self.users = newUsers;

            self.totalUsersLoaded -= removedCount;

            return removedCount;

        }

    }]);