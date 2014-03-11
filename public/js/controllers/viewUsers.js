'use strict';

angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', 'UserManager', function ($scope, UserManager) {

        $scope.currentUserIndex = 0;

        $scope.users = UserManager.users;

        $scope.userManager = UserManager;

    }]);