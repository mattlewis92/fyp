angular.module('fyp.services')
    .service('googleSearch', ['$http', 'googleSearchApiKey', 'googleSearchId', function ($http, googleSearchApiKey, googleSearchId) {

        this.query = function (text) {
            return $http.jsonp('https://www.googleapis.com/customsearch/v1?key=' + googleSearchApiKey + '&cx=' + googleSearchId + '&q=' + escape(text) + '&callback=JSON_CALLBACK');
        }

    }]);