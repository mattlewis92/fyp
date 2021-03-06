'use strict';

angular
    .module('fyp')
    .config(['$stateProvider', '$locationProvider', function ($stateProvider, $locationProvider) {

        //setup states
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('app', {
                url: '/',
                templateUrl: 'container.html',
                controller: ['$state', function($state) {
                    $state.go('app.addUsers');
                }]
            })
            .state('app.addUsers', {
                templateUrl: '/views/addUsers.html',
                controller: 'AddUsersCtrl'
            })
            .state('app.lookupUsers', {
                templateUrl: '/views/lookupUsers.html',
                controller: 'LookupUsersCtrl'
            })
            .state('app.viewUsers', {
                templateUrl: '/views/viewUsers.html',
                controller: 'ViewUsersCtrl'
            })
            .state('app.showMatches', {
                templateUrl: '/views/showMatches.html',
                controller: 'ShowMatchesCtrl'
            });

    }])
    .run(['$http', '$angularCacheFactory', function ($http, $angularCacheFactory) {

        //cache options
        var cache = $angularCacheFactory('defaultCache', {
            storageMode: 'localStorage', //store in local storage
            capacity: 10000
        });

    }])
    .config(['$provide', function ($provide) {
        //Modified from stackoverflow, same as $q.all() except will resolve even if some promises fail
        $provide.decorator('$q', ['$delegate', function ($delegate) {
            var $q = $delegate;

            // Extention for q
            $q.allSettled = $q.allSettled || function (promises) {
                var deferred = $q.defer();
                if (angular.isArray(promises)) {
                    var states = [];
                    var results = [];
                    var didAPromiseFail = false;

                    // First create an array for all promises with their state
                    angular.forEach(promises, function (promise, key) {
                        states[key] = false;
                    });

                    // Helper to check if all states are finished
                    var checkStates = function (states, results, deferred, failed) {
                        var allFinished = true;
                        angular.forEach(states, function (state, key) {
                            if (!state) {
                                allFinished = false;
                            }
                        });
                        if (allFinished) {
                            if (failed) {
                                deferred.reject(results);
                            } else {
                                deferred.resolve(results);
                            }
                        }
                    }

                    // Loop through the promises
                    // a second loop to be sure that checkStates is called when all states are set to false first
                    angular.forEach(promises, function (promise, key) {
                        $q.when(promise).then(function (result) {
                            states[key] = true;
                            results[key] = result;
                            checkStates(states, results, deferred, didAPromiseFail);
                        }, function (reason) {
                            states[key] = true;
                            results[key] = reason;
                            didAPromiseFail = false;
                            checkStates(states, results, deferred, didAPromiseFail);
                        });
                    });

                    if (states.length == 0) {
                        deferred.resolve(results);
                    }

                } else {
                    throw 'allSettled can only handle an array of promises (for now)';
                }

                return deferred.promise;
            };

            return $q;
        }]);
    }]);