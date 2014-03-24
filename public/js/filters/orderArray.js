/**
 * Simple filter for sorting an array
 */
angular
    .module('fyp.filters')
    .filter('orderArray', function() {
        return function(input) {
            return input.sort();
        }
    });