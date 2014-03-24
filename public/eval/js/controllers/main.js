'use strict';

angular
    .module('eval.controllers')
    .controller('MainCtrl', ['$scope', '$http', 'userManager', 'user', function ($scope, $http, userManager, user) {

        //hard code the current group for testing purposes
        userManager.currentGroup = 'Tech Wednesday';

        $scope.loading = true;

        //load in users
        userManager
            .loadInOtherUsers(user)
            .then(function() {
                $scope.loading = false;

                //find matches between users
                userManager.users.forEach(function(user) {
                    user.updateKeywords();
                });

                //sort users by the number of matches found
                userManager.users.sort(function(a, b) {
                    return b.matches.length - a.matches.length;
                });
            });

        $scope.userManager = userManager;

        $scope.otherUsers = [];

        //find user by id
        var findById = function(id) {
            return userManager.users.filter(function(user) {
               return user.id == id;
            })[0];
        }

        var userIds = [];

        $scope.currentUser = 0;

        //when a user is selected from the drop down
        $scope.$watch('userId', function(newValue) {
            if (newValue) {
                $scope.otherUsers = [];
                userIds = [];
                userManager.users.forEach(function(user) {
                    if (user.id == newValue) {
                        userIds.push(user.id);
                        $scope.user = user;

                        //grab the best matches
                        user.matches.sort(function(a, b) {
                            return b.score - a.score;
                        });

                        user.matches.forEach(function(match) {
                            if ($scope.otherUsers.length == 10) { //only grab 10 matches
                                return;
                            }
                            $scope.otherUsers.push({score: match.score, user: findById(match.user.id)});
                            userIds.push(match.user.id);
                        });

                        //now find some other random users that weren't matches
                        userManager.users = shuffle(userManager.users);

                        userManager.users.forEach(function(user) {

                            if (userIds.indexOf(user.id) == -1 && $scope.otherUsers.length < 20) {
                                $scope.otherUsers.push({score: 0, user: user});
                                userIds.push(user.id);
                            }

                        });
                    }
                });
            }
        });

        //http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
        function shuffle(o){ //v1.0
            for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }

        //get the users avatar from social network data
        $scope.getAvatar = function(user) {

           if (!user) return;

           var avatar = null;

            user.linkedinProfiles.forEach(function(profile) {
                if (!avatar && profile.isSelected == true && profile.profile.pictureUrl) avatar = profile.profile.pictureUrl
            });

            user.twitterProfiles.forEach(function(profile) {
                if (!avatar && profile.isSelected == true && profile.profile.profile_image_url) avatar = profile.profile.profile_image_url
            });

           return avatar;
        }

        //get a given users linked in url
        $scope.getLinkedIn = function(user) {
            if (!user) return;
            var result;
            user.linkedinProfiles.forEach(function(profile) {
               if (profile.isSelected) result = profile.link;
            });
            return result;
        }

        //get the given users twitter page url
        $scope.getTwitter = function(user) {
            if (!user) return;
            var result;
            user.twitterProfiles.forEach(function(profile) {
                if (profile.isSelected) result = profile.link;
            });
            return result;
        }

        var dataToStore = {
            results: []
        };

        //store the result of a match
        $scope.storeResult = function(result) {

            $scope.user.profile.id = $scope.user.id;
            $scope.otherUsers[$scope.currentUser].user.profile.id = $scope.otherUsers[$scope.currentUser].user.id;

            dataToStore.user = $scope.user.profile;
            dataToStore.results.push({
                user: $scope.otherUsers[$scope.currentUser].user.profile,
                calculatedScore: $scope.otherUsers[$scope.currentUser].score,
                userSaidGoodMatch: result
            });

            $scope.currentUser++;

            //persist it to the server if we've processed 20 users
            if ($scope.currentUser == $scope.otherUsers.length) {
                $http.post('/api/user/store_evaluation', {result: dataToStore});
            }

        }

    }]);
