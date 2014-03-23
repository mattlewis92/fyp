angular
    .module('fyp.services')
    .service('keywords', ['$http', '$q', '$angularCacheFactory', function ($http, $q, $angularCacheFactory) {

        var addKeyword = function (list, word, count) {

            if (list[word]) {
                list[word] += count;
            } else {
                list[word] = count;
            }

            return list;
        }

        this.concatLists = function (list1, list2) {
            angular.forEach(list2, function (count, word) {
                list1 = addKeyword(list1, word, count);
            });
            return list1;
        }

        this.extract = function (textArray) {

            //Add full stops to the end of each string so that the parser won't accidentally join 2 unrelated nouns together
            textArray = textArray.map(function(item) {
                item = item.trim();
                if (item.lastIndexOf('.') != item.length-1) {
                    item += '.';
                }
                return item;
            });

            return $http.post('/api/nlp/extract_keywords', {text: textArray.join(' ')}, {cache: $angularCacheFactory.get('defaultCache')});
        }

    }]);