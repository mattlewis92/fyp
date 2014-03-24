'use strict';

angular
    .module('eval.controllers')
    .controller('MainCtrl', ['$scope', '$http', 'userManager', 'user', function ($scope, $http, userManager, user) {

        userManager.currentGroup = 'Tech Wednesday';

        $scope.loading = true;

        userManager
            .loadInOtherUsers(user)
            .then(function() {
                $scope.loading = false;

                userManager.users.forEach(function(user) {
                    user.updateKeywords();
                });

                userManager.users.sort(function(a, b) {
                    return b.matches.length - a.matches.length;
                });
            });

        $scope.userManager = userManager;

        $scope.otherUsers = [];

        var findById = function(id) {
            return userManager.users.filter(function(user) {
               return user.id == id;
            })[0];
        }

        var userIds = [];

        $scope.currentUser = 0;

        $scope.$watch('userId', function(newValue) {
            if (newValue) {
                userManager.users.forEach(function(user) {
                    if (user.id == newValue) {
                        userIds.push(user.id);
                        $scope.user = user;

                        user.matches = shuffle(user.matches);

                        user.matches.forEach(function(match) {
                            if ($scope.otherUsers.length == 10) {
                                return;
                            }
                            $scope.otherUsers.push({score: match.score, user: findById(match.user.id)});
                            userIds.push(match.user.id);
                        });

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

        $scope.getLinkedIn = function(user) {
            if (!user) return;
            var result;
            user.linkedinProfiles.forEach(function(profile) {
               if (profile.isSelected) result = profile.link;
            });
            return result;
        }

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

            if ($scope.currentUser == $scope.otherUsers.length) {
                $http.post('/api/user/store_evaluation', {result: dataToStore});
            }

        }

    }]);
