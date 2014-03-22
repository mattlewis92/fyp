angular.module('fyp.services')
    .service('googleSearch', ['$http', '$q', '$angularCacheFactory', 'googleSearchApiKey', 'googleSearchId', 'linkedInProfile', 'twitterProfile', function ($http, $q, $angularCacheFactory, googleSearchApiKey, googleSearchId, linkedInProfile, twitterProfile) {

        this.query = function (text) {

            var self = this;

            return $http
                .jsonp('https://www.googleapis.com/customsearch/v1?key=' + googleSearchApiKey + '&cx=' + googleSearchId + '&q=' + encodeURIComponent(text) + '&callback=JSON_CALLBACK', {cache: $angularCacheFactory.get('defaultCache')})
                .then(function(results) {
                    return self.parseResults(results.data);
                });
        }


        this.parseResults = function(googleResults) {

            if (googleResults.error) throw 'Google search API error: ' + googleResults.error.message;

            if (!googleResults.items) googleResults.items = [];

            var twitterProfiles = [];
            var linkedInProfiles = [];
            var otherLinks = [];

            var linkedInProfileUrls = [];
            var twitterProfileUrls = [];

            var arrayUnique = function(arr) {
                return arr.reduce(function(build, item) {
                    if (build.indexOf(item) < 0) build.push(item);
                    return build;
                }, []);
            };

            angular.forEach(googleResults.items, function (item) {

                if (item.displayLink == 'twitter.com') {
                    twitterProfileUrls.push(item.link);
                } else if (item.formattedUrl.indexOf('linkedin.com') > -1 && item.link.indexOf('pub/dir/') == -1) {
                    linkedInProfileUrls.push(item.link);
                } else {
                    otherLinks.push(item);
                }

            });

            twitterProfileUrls = arrayUnique(twitterProfileUrls);
            linkedInProfileUrls = arrayUnique(linkedInProfileUrls);

            var promise1 = twitterProfile
                .extractFromUrls(twitterProfileUrls)
                .then(function(profiles) {
                    twitterProfiles = profiles.map(function(profile) {
                        profile.isSelected = false;
                        return profile;
                    });
                });

            var promise2 = linkedInProfile
                .extractFromUrls(linkedInProfileUrls)
                .then(function(profiles) {
                    linkedInProfiles = profiles.map(function(profile) {
                        profile.isSelected = false;
                        return profile;
                    });
                });

            return $q
                .allSettled([promise1, promise2])
                .then(function() {
                    return {otherLinks: otherLinks, linkedInProfiles: linkedInProfiles, twitterProfiles: twitterProfiles};
                });
        }

    }]);