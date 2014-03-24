'use strict';

/**
 * Controller for showing the loading screen when searching users
 */
angular
    .module('fyp.controllers')
    .controller('LookupUsersCtrl', ['$scope', '$state', 'userManager', 'user', function ($scope, $state, userManager, user) {

        $scope.userManager = userManager;

        var watcher = $scope.$watch(function() {
            return $scope.userManager.totalUsersLoaded; //use this watcher to check when all users are loaded
        }, function (newValue) {
            if (newValue == $scope.userManager.users.length) {
                watcher(); //cancel the watcher

                $scope.loadingOtherUsers = true;

                //Now load in all users that have been processed in the past
                userManager
                    .loadInOtherUsers(user)
                    .then(function() {
                        $scope.loadingOtherUsers = false;
                        $state.go('app.viewUsers');
                    });
            }
        });

    }]);