angular.module('fyp.services')
    .service('twitterProfile', ['$q', '$http', '$angularCacheFactory', 'keywords', function ($q, $http, $angularCacheFactory, keywords) {

        var self = this;

        this.extractFromUrl = function(profileUrl) {

            var deferred = $q.defer();

            $http
                .get('/api/social/twitter?screen_name=' + profileUrl.replace('https://twitter.com/', ''), {cache: $angularCacheFactory.get('defaultCache')})
                .success(function (profile) {

                    keywords = {};

                    if (profile.peerindex) {
                        profile.peerindex.topics.forEach(function(topic) {
                            keywords[topic.name] = 1;
                        });

                        profile.peerindex.benchmark_topics.forEach(function(topic) {
                            keywords[topic.name] = 1;
                        });
                    }

                    deferred.resolve({profile: profile.user, keywords: keywords, link: profileUrl});

                    /*var tweets = [];
                    profile.latest_tweets.forEach(function(tweet) {
                        tweets.push(tweet.text);
                    });

                    keywords
                        .extract(tweets)
                        .then(function (result) {
                            deferred.resolve({profile: profile.user, keywords: result.data, link: profileUrl});
                        }, function () {
                            deferred.resolve({profile: profile.user, keywords: {}, link: profileUrl});
                        });*/
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