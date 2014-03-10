angular
    .module('fyp.services')
    .service('keywords', ['$http', '$q', function ($http, $q) {

        var addKeyword = function (list, keyword, weight) {
            weight = parseFloat(weight);
            keyword = keyword.replace(/\b[a-z]/g, function (letter) {
                return letter.toUpperCase();
            });
            var found = false;

            angular.forEach(list, function (item, index) {
                if (item.keyword.toLowerCase() == keyword.toLowerCase()) {
                    found = true;
                    list[index].weight = parseFloat(((list[index].weight + weight) / 2).toFixed(3));
                }
            });

            if (!found) {
                list.push({
                    keyword: keyword,
                    weight: weight
                });
            }

            return list;
        }

        this.concatLists = function (list1, list2) {
            angular.forEach(list2, function (item) {
                list1 = addKeyword(list1, item.keyword, item.weight);
            });
            return list1;
        }

        this.extract = function (textArray) {

            var requests = [];

            angular.forEach(textArray, function (text) {
                requests.push($http.jsonp("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20contentanalysis.analyze%20where%20text%3D'" + encodeURIComponent(text.replace(/'/g, "\\'")) + "'%3B&format=json&diagnostics=true&callback=JSON_CALLBACK"));
            });

            return $q.allSettled(requests).then(function (results) {

                var keywords = [];

                angular.forEach(results, function (result) {

                    if (result.data && result.data.query && result.data.query.results) {

                        if (result.data.query.results.yctCategories) {

                            if (toString.call(result.data.query.results.yctCategories.yctCategory) == '[object Array]') {
                                angular.forEach(result.data.query.results.yctCategories.yctCategory, function (category) {
                                    keywords = addKeyword(keywords, category.content, category.score);
                                });
                            } else {
                                keywords = addKeyword(keywords, result.data.query.results.yctCategories.yctCategory.content, result.data.query.results.yctCategories.yctCategory.score);
                            }

                        }

                        if (result.data.query.results.entities) {
                            if (toString.call(result.data.query.results.entities.entity) == '[object Array]') {
                                angular.forEach(result.data.query.results.entities.entity, function (entity) {
                                    keywords = addKeyword(keywords, entity.text.content, entity.score);
                                });
                            } else {
                                keywords = addKeyword(keywords, result.data.query.results.entities.entity.text.content, result.data.query.results.entities.entity.score);
                            }

                        }

                    }

                });

                return keywords;
            }, null);
        }

    }]);