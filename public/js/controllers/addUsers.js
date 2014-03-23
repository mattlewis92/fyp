'use strict';

angular
    .module('fyp.controllers')
    .controller('AddUsersCtrl', ['$scope', '$state', 'csv', 'userManager', 'user', function ($scope, $state, csv, userManager, user) {

        $scope.users = userManager.users;

        $scope.userManager = userManager;

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

        userManager
            .getAvailableGroups()
            .success(function(result) {
                $scope.groups = result.groups;
            });

        //debug
        //return;
        $scope.addUser({name: "ooj", surname: "jhutti", email: "ooj@iwaz.at", company: "iwazat"});
        $scope.addUser({name: "ben", surname: "nimmo", email: "ben@socialsignin.co.uk"});
        $scope.addUser({name: "Stuart", surname: "ford", email: "stuart@glide.uk.com", company: "Glide"});
        //$scope.next();

    }]);