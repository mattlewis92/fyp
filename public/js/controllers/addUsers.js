'use strict';

angular
    .module('fyp.controllers')
    .controller('AddUsersCtrl', ['$scope', '$state', 'csv', 'userManager', 'user', function ($scope, $state, csv, userManager, user) {

        $scope.users = userManager.users;

        $scope.next = function() {
            userManager.lookupAllUsers();
        }

        $scope.$watch('csv', function (newValue) {

            if (newValue) {
                var csvData = csv.parse(newValue);

                angular.forEach(csvData, function (line) {

                    if (line.length > 1) {
                        $scope.addUser({
                            name: line[0],
                            surname: line[1],
                            company: line[2],
                            location: line[3],
                            email: line[4]
                        });
                    }

                });

            }

        });

        $scope.user = {};

        $scope.addUser = function(profile) {
            userManager.addUser(new user(profile));
        }

    }]);