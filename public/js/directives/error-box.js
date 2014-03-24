'use strict';

/**
 * Simple directive for showing global errors
 */
angular.module('fyp.directives').
    directive('errorBox', ['errorHandler', function (errorHandler) {
        return {
            restrict: 'EA',
            template: '<div class="alert alert-danger" ng-show="errors.length > 0"><button type="button" class="close" ng-click="errors = []">&times;</button><ul><li ng-repeat="error in errors">{{ error }}</li></ul></div>',
            link: function (scope, element, attrs) {

                scope.errors = errorHandler.errors;

            }
        }
    }]);