'use strict';

angular.module('userData.directives').
  directive('tagCloudElement', [function() {
    return {
      restrict: 'EA',
      scope: {
        weight: '=tagCloudWeight',
        word: '=tagCloudKeyword'
      },
      link: function(scope, element, attrs) {

        var max = 28;

        scope.$watch('weight', function(weight) {
          if (weight) {
            element.css({
              fontSize: (max * weight) + 'px'
            });
          }
        });

        scope.$watch('word', function(newValue) {
          if (newValue) {
            element.html(newValue);
          }
        });
      }
    }
  }]);