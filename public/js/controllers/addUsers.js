'use strict';

/**
 * Controller for allowing the user to input the user details to search
 */
angular
    .module('fyp.controllers')
    .controller('AddUsersCtrl', ['$scope', '$state', 'csv', 'userManager', 'user', function ($scope, $state, csv, userManager, user) {

        $scope.users = userManager.users;

        $scope.userManager = userManager;

        //go to the next state
        $scope.next = function() {
            userManager.lookupAllUsers();
        }

        //If a CSV was added then add it's data to the users to process list
        $scope.$watch('csv', function (newValue) {

            if (newValue) {
                var csvData = csv.parse(newValue);

                angular.forEach(csvData, function (line) {

                    if (line.length > 1) {
                        $scope.addUser({
                            name: line[0],
                            surname: line[1],
                            location: line[2],
                            company: line[3],
                            twitterScreenName: line[4]
                        });
                    }

                });

            }

        });

        $scope.user = {};

        $scope.addUser = function(profile) {
            userManager.addUser(new user(profile));
        }

        //Get available groups
        userManager
            .getAvailableGroups()
            .success(function(result) {
                $scope.groups = result.groups;
            });


    }]);