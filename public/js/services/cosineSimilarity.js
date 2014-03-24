/**
 * Computes cosine similarity of 2 vectors
 */
angular.module('fyp.services')
    .service('cosineSimilarity', [function () {

        var absVector = function(vector) {
            return Math.sqrt(vector.reduce(function(previousValue, currentValue) {
                return previousValue + (currentValue * currentValue);
            }, 0));
        }

        var dotProduct = function(vector1, vector2) {
            return vector1.reduce(function(previousValue, currentValue, index) {
                return previousValue + (currentValue * vector2[index]);
            }, 0);
        }

        return function(vector1, vector2) {
            return dotProduct(vector1, vector2) / (absVector(vector1) * absVector(vector2));
        }

    }]);