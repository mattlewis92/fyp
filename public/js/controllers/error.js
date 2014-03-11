'use strict';

angular
    .module('fyp.controllers')
    .controller('ErrorCtrl', ['$scope', 'errorHandler', function ($scope, errorHandler) {
        $scope.errors = errorHandler.errors;
    }]);