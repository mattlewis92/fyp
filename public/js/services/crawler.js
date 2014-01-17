angular.module('userData.services').
  service('crawler', ['$http', '$angularCacheFactory', function($http, $angularCacheFactory) {

    this.crawl = function(url) {
      return $http.get('/link/crawl?site=' + url, {cache: $angularCacheFactory.get('defaultCache')});
    }

  }]);