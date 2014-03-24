'use strict';

angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', '$filter', 'userManager', 'context', function ($scope, $filter, userManager, context) {

        userManager.users = $filter('orderBy')(userManager.users, 'profile.surname');

        $scope.currentUserIndex = context.currentUserIndex || 0;

        $scope.userManager = userManager;

        $scope.isEmptyObject = function(obj) {
            return angular.equals({}, obj);
        }

        $scope.switchUser = function(userId) {

            angular.forEach($scope.userManager.users, function(user, index) {
                if (user.id == userId) {
                    user.updateKeywords(); //update matches when viewing the user
                    $scope.currentUserIndex = index;
                    context.currentUserIndex = index;
                }
            });
        }

        $scope.userSelected = function() {
            $scope.switchUser($scope.userToSelect.id);
            $scope.userToSelect = null;
        }

        if (!context.usersPruned) {
            $scope.usersRemoved = userManager.removeUsersWithNoProfilesFound();
            context.usersPruned = true;
        }

        $scope.switchUser(userManager.users[$scope.currentUserIndex].id);

    }]);