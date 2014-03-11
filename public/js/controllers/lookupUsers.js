'use strict';

angular
    .module('fyp.controllers')
    .controller('LookupUsersCtrl', ['$scope', 'userManager', function ($scope, userManager) {

        $scope.users = userManager.users;
        $scope.totalUsersLoaded = userManager.totalUsersLoaded;

    }]);