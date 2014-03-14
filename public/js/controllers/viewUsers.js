'use strict';

angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', 'userManager', function ($scope, userManager) {

        $scope.currentUserIndex = 0;

        $scope.users = userManager.users;

        $scope.userManager = userManager;

        $scope.isEmptyObject = function(obj) {
            return angular.equals({}, obj);
        }

        $scope.switchUser = function(userId) {
            angular.forEach($scope.users, function(user, index) {
                if (user.id == userId) $scope.currentUserIndex = index;
            });
        }

        $scope.users.forEach(function(user) {
            user.autoSelectProfiles();
        });

    }]);