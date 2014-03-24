'use strict';

/**
 * HTML5 file reader for the CSV to save uploading it to the server first
 */
angular.module('fyp.directives').
    directive('fileUpload', [function () {
        return {
            restrict: 'EA',
            scope: {
                fileUpload: "="
            },
            link: function (scope, element, attrs) {

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