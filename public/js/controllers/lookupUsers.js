'use strict';

angular
    .module('fyp.controllers')
    .controller('LookupUsersCtrl', ['$scope', 'UserManager', function ($scope, UserManager) {

        $scope.users = UserManager.users;
        $scope.totalUsersLoaded = UserManager.totalUsersLoaded;

    }]);