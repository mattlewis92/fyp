'use strict';

angular
  .module('userData', [
  'ngRoute',
  'jmdobry.angular-cache',
  'userData.config',
  'userData.directives',
  'userData.controllers',
  'userData.services'
  ])
  .config([ '$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider.when('/', {
      templateUrl: '/views/app.html',
      controller: 'IndexCtrl'
    });

  }])
  .run(['$http', '$angularCacheFactory', function ($http, $angularCacheFactory) {

    var cache = $angularCacheFactory('defaultCache', {
      maxAge: 900000, // Items added to this cache expire after 15 minutes.
      cacheFlushInterval: 6000000, // This cache will clear itself every hour.
      deleteOnExpire: 'aggressive', // Items will be deleted from this cache right when they expire.
      storageMode: 'localStorage', //store in local storage
      capacity: 10000
    });

  }])
  .config(['$provide', function ($provide) {
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
        } else {
          throw 'allSettled can only handle an array of promises (for now)';
        }

        return deferred.promise;
      };

      return $q;
    }]);
  }]);