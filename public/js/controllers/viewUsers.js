'use strict';

/**
 * Controller for handling displaying of users
 */
angular
    .module('fyp.controllers')
    .controller('ViewUsersCtrl', ['$scope', '$filter', 'userManager', 'context', function ($scope, $filter, userManager, context) {

        //sort user list by surname
        userManager.users = $filter('orderBy')(userManager.users, 'profile.surname');

        //If we reloaded a user then show the user we were on before
        $scope.currentUserIndex = context.currentUserIndex || 0;

        $scope.userManager = userManager;

        //if obj == {}
        $scope.isEmptyObject = function(obj) {
            return angular.equals({}, obj);
        }

        //change user
        $scope.switchUser = function(userId) {

            angular.forEach($scope.userManager.users, function(user, index) {
                if (user.id == userId) {
                    user.updateKeywords(); //update matches when viewing the user
                    $scope.currentUserIndex = index;
                    context.currentUserIndex = index;
                }
            });
        }

        //used by the typeahead directive to change user
        $scope.userSelected = function() {
            $scope.switchUser($scope.userToSelect.id);
            $scope.userToSelect = null;
        }

        //prune all users with no profile info found
        if (!context.usersPruned) {
            $scope.usersRemoved = userManager.removeUsersWithNoProfilesFound();
            context.usersPruned = true;
        }

        //Call this here to make sure keywords + matches are loaded
        $scope.switchUser(userManager.users[$scope.currentUserIndex].id);

    }]);