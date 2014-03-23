'use strict';

angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', 'userManager', 'context', function ($scope, userManager, context) {

        $scope.currentUserIndex = context.currentUserIndex || 0;

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

        $scope.userSelected = function() {
            $scope.switchUser($scope.userToSelect.id);
            $scope.userToSelect = null;
        }

        $scope.usersRemoved = userManager.removeUsersWithNoProfilesFound();

    }]);