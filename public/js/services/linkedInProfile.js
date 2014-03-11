angular.module('fyp.services')
    .service('linkedInProfile', ['$q', '$http', '$angularCacheFactory', 'keywords', function ($q, $http, $angularCacheFactory, keywords) {

        var self = this;

        this.extractFromUrl = function(url) {
            var deferred = $q.defer();

            $http
                .get('/api/social/linkedin?profile_url=' + url, {cache: $angularCacheFactory.get('defaultCache')})
                .success(function (profile) {

                    if (profile.firstName == 'private') {
                        deferred.reject('Profile is private');
                        return;
                    }

                    var text = [];
                    angular.forEach(['summary', 'headline', 'industry'], function (field) {
                        if (angular.isDefined(profile[field])) text.push(profile[field]);
                    });
                    angular.forEach(profile.positions.values, function (position) {
                        if (position.summary) text.push(position.summary);
                    });

                    keywords
                        .extract(text)
                        .then(function (keywords) {
                            deferred.resolve({profile: profile, keywords: keywords, link: url});
                        }, function () {
                            deferred.resolve({profile: profile, keywords: [], link: url});
                        });
                })
                .error(function(message) {
                    deferred.reject(message);
                });

            return deferred.promise;
        }

        this.extractFromUrls = function(urls) {
            var requests = [];
            urls.forEach(function(url) {
                requests.push(self.extractFromUrl(url));
            });

            return $q
                .allSettled(requests)
                .then(function(results) {
                    return results.filter(function(result) {
                        return !!result.profile;
                    });
                });
        }

    }]);