angular.module('fyp.services')
    .service('twitterProfile', ['$q', '$http', '$angularCacheFactory', 'keywords', function ($q, $http, $angularCacheFactory, keywords) {

        var self = this;

        this.extractFromUrl = function(profileUrl) {

            var deferred = $q.defer();

            $http
                .get('/api/social/twitter?screen_name=' + profileUrl.replace('https://twitter.com/', ''), {cache: $angularCacheFactory.get('defaultCache')})
                .success(function (profile) {

                    var keywords = [];

                    angular.forEach(profile.peerindex.topics, function (topic) {
                        keywords.push({
                            keyword: topic.name,
                            weight: topic.topic_score / 100 //yahoo returns a weight from 0 to 1 so let's keep that format
                        });
                    });

                    deferred.resolve({profile: profile.user, keywords: keywords, link: profileUrl});

                })
                .error(function (message) {
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