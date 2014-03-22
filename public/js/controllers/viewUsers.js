'use strict';

angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', 'userManager', 'context', function ($scope, userManager, context) {

        $scope.currentUserIndex = context.currentUserIndex || 0;

        $scope.typeaheadUsers = [];

        $scope.userManager = userManager;

        $scope.isEmptyObject = function(obj) {
            return angular.equals({}, obj);
        }

        $scope.switchUser = function(userId) {
            angular.forEach($scope.userManager.users, function(user, index) {
                if (user.id == userId) {
                    $scope.currentUserIndex = index;
                    context.currentUserIndex = index;
                }
            });
        }

        $scope.userManager.users.forEach(function(user, index) {
            user.autoSelectProfiles();
            var profile = angular.copy(user.profile);
            profile.index = index;
            $scope.typeaheadUsers.push(profile);
        });

        $scope.userSelected = function() {
            $scope.currentUserIndex = $scope.userToSelect.index;
            $scope.userToSelect = null;
        }

        $scope.usersRemoved = userManager.removeUsersWithNoProfilesFound();

    }]);