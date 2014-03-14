angular
    .module('fyp.filters')
    .filter('orderArray', function() {
        return function(input) {
            return input.sort();
        }
    });