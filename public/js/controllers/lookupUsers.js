'use strict';

angular
    .module('fyp.controllers')
    .controller('LookupUsersCtrl', ['$scope', '$state', 'userManager', 'user', function ($scope, $state, userManager, user) {

        $scope.userManager = userManager;

        var watcher = $scope.$watch(function() {
            return $scope.userManager.totalUsersLoaded;
        }, function (newValue) {
            if (newValue == $scope.userManager.users.length) {
                watcher(); //cancel the watcher

                userManager
                    .loadInOtherUsers(user)
                    .then(function() {
                        $state.go('app.viewUsers');
                    });
            }
        });

    }]);