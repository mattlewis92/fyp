'use strict';

angular
    .module('fyp.controllers')
    .controller('AddUsersCtrl', ['$scope', '$state', 'csv', 'UserManager', 'User', function ($scope, $state, csv, UserManager, User) {

        $scope.users = UserManager.users;

        $scope.next = function() {
            UserManager.lookupAllUsers();
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
            var user = new User(profile);
            UserManager.addUser(user);
        }

    }]);