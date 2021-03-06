/**
 * Service used for converting a linked in profile to a full profile and list of keywords
 */
angular.module('fyp.services')
    .service('linkedInProfile', ['$q', '$http', '$angularCacheFactory', 'keywords', function ($q, $http, $angularCacheFactory, keywords) {

        var self = this;

        //Given a linkedin profile url, grab the profile and extract keywords
        this.extractFromUrl = function(url) {
            var deferred = $q.defer();

            $http
                .get('/api/social/linkedin?profile_url=' + url, {cache: $angularCacheFactory.get('defaultCache')})
                .success(function (profile) {

                    //handle private profiles
                    if (profile.firstName == 'private') {
                        deferred.reject('Profile is private');
                        return;
                    }

                    var text = [];
                    angular.forEach(['summary', 'headline', 'industry'], function (field) {
                        if (angular.isDefined(profile[field])) text.push(profile[field]);
                    });

                    if (profile.positions) {
                        angular.forEach(profile.positions.values, function (position) {
                            if (position.summary) text.push(position.summary);
                        });
                    }

                    //extract keywords
                    keywords
                        .extract(text)
                        .then(function (result) {
                            deferred.resolve({profile: profile, keywords: result.data, link: url});
                        }, function () {
                            deferred.resolve({profile: profile, keywords: {}, link: url});
                        });
                })
                .error(function(message) {
                    deferred.reject(message);
                });

            return deferred.promise;
        }

        //Helper function to handle an array of urls
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