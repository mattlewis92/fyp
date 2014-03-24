/**
 * User manager for managing all users in the system
 */
angular
    .module('fyp.services')
    .service('userManager', ['$http', '$q', '$state', 'errorHandler', function ($http, $q, $state, errorHandler) {

        var self = this;

        this.users = [];

        this.totalUsersLoaded = 0;

        //The current group set that all users found will be added to
        this.currentGroup = '';

        //Add a new user
        this.addUser = function(user) {
            //check they've not already been found
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

        //remove a user
        this.removeUser = function(user) {
            angular.forEach(self.users, function(otherUser, index) {
                if (user.id == otherUser.id) {
                    self.users.splice(index, 1);
                    $http
                        .post('/api/user/delete', {id: user.id}) //persist this change to the database
                        .error(errorHandler.handleError);
                }
            });
        }

        //Lookup all users in batches of 5 to prevent tonnes of http requests going out filling up memory
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

        //Lookup a single user
        this.lookupUser = function(user) {
            self.totalUsersLoaded--;
            $state.go('app.lookupUsers');
            user.lookup();
        }

        //Remove all users with no profile data found
        this.removeUsersWithNoProfilesFound = function() {

            var removedCount = 0;

            angular.copy(self.users).forEach(function(user) {
               var hasProfileData = user.hasFoundProfileData();
               if (!hasProfileData) {
                   removedCount++;
                   self.removeUser(user);
               }
            });

            self.totalUsersLoaded -= removedCount;

            return removedCount;

        }

        //Get all available groups
        this.getAvailableGroups = function() {
            return $http.get('/api/user/get_group_names');
        }

        //Any users that have been processed in the past, then load them in now
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
                        //build the user object and add it
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

                })
                .error(errorHandler.handleCriticalError)
                .finally(function() {
                    deferred.resolve(true);
                });

            return deferred.promise;
        }

    }]);