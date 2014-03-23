angular
    .module('fyp.services')
    .service('userManager', ['$http', '$q', '$state', 'errorHandler', function ($http, $q, $state, errorHandler) {

        var self = this;

        this.users = [];

        this.totalUsersLoaded = 0;

        this.currentGroup = '';

        this.addUser = function(user) {
            var found = false;
            self.users.forEach(function(user2) {
                if (user.id && user.id == user2.id) found = true;
            });
            if (!found) {
                self.users.push(user);
                return true;
            }
            return false;
        }

        this.removeUser = function(user) {
            angular.forEach(self.users, function(otherUser, index) {
                if (user == otherUser) {
                    self.users.splice(index, 1);
                    $http
                        .post('/api/user/delete', {id: user.id})
                        .error(errorHandler.handleError);
                }
            });
        }

        this.lookupAllUsers = function() {
            self.totalUsersLoaded = 0;
            $state.go('app.lookupUsers');
            var users = angular.copy(self.users);
            var maxToProcess = 5;

            var lookupUser = function() {
                if (users.length > 0) {
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

            var originalUsersAmount = self.users.length;

            var newUsers = self.users.filter(function(user) {
               var hasProfileData = user.hasFoundProfileData();
               if (!hasProfileData) {
                    self.removeUser(user);
               }
               return hasProfileData;
            });

            var removedCount = originalUsersAmount - newUsers.length;

            self.totalUsersLoaded -= removedCount;

            return removedCount;

        }

        this.getAvailableGroups = function() {
            return $http.get('/api/user/get_group_names');
        }

        this.loadInOtherUsers = function(userService) {

            var deferred = $q.defer();

            if (self.areUsersLoaded) { //prevent more calls to this function
                deferred.resolve(false);
                return deferred.promise;
            }
            self.areUsersLoaded = true;

            $http
                .get('/api/user/find_by_group_name?group_name=' + self.currentGroup)
                .success(function(users) {

                    angular.forEach(users, function(user, id) {
                        var profile = {
                            name: user.name,
                            surname: user.surname,
                            location: user.location,
                            company: user.company
                        };
                        var userObj = new userService(profile);
                        userObj.id = id;
                        userObj.keywords = user.keywords;
                        userObj.twitterProfiles = user.twitter_profiles;
                        userObj.linkedinProfiles = user.linked_in_profiles;
                        userObj.otherLinks = user.otherLinks;
                        if (self.addUser(userObj)) {
                            self.totalUsersLoaded += 1;
                        }
                    });

                    self.users.forEach(function(user) {
                        user.updateKeywords();
                    });
                })
                .error(errorHandler.handleCriticalError)
                .finally(function() {
                    deferred.resolve(true);
                });

            return deferred.promise;
        }

    }]);