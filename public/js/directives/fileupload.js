'use strict';

angular.module('userData.directives', []).
  directive('fileUpload', [function() {
    return {
      restrict: 'EA',
      scope: {
        fileUpload: "="
      },
      link: function(scope, element, attrs) {

        element.bind("change", function (changeEvent) {

          var reader = new FileReader();
          reader.onload = function (loadEvent) {
            scope.$apply(function () {
              scope.fileUpload = loadEvent.target.result.replace(/\r/g, "\n");
            });
          }
          reader.readAsText(changeEvent.target.files[0]);

        });

      }
    }
  }]);