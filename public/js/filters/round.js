/**
 * Simple filter for rounding a float to x decimal places
 */
angular
    .module('fyp.filters')
    .filter('round', function() {
        return function(input, places) {
            return input.toFixed(places);
        }
    });