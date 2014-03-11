angular
    .module('fyp.services')
    .service('user', ['$http', '$angularCacheFactory', 'googleSearch', 'keywords', 'userManager', function ($http, $angularCacheFactory, googleSearch, keywords, userManager) {

        return function(profile) {

            var self = this;

            this.profile = profile;

            this.keywords = [];

            this.updateKeywords = function() {

                self.keywords = [];

                angular.forEach(self.linkedinProfiles, function (profile) {
                    if (profile.isSelected == true) {
                        self.keywords = keywords.concatLists(self.keywords, profile.profile.keywords);
                    }
                });

                angular.forEach(self.twitterProfiles, function (profile) {
                    if (profile.isSelected == true) {
                        self.keywords = keywords.concatLists(self.keywords, profile.keywords);
                    }
                });

            }

            this.updateOtherFieldsFromSocial = function() {
                angular.forEach(self.linkedinProfiles, function (item) {
                    if (item.isSelected && angular.isDefined(item.profile.location.name) && (!angular.isDefined(self.profile.location) || self.profile.location.length == 0)) {
                        self.profile.location = item.profile.location.name;
                    }
                });

                angular.forEach(self.twitterProfiles, function (item) {
                    if (item.isSelected && angular.isDefined(item.profile.location) && (!angular.isDefined(self.profile.location) || self.profile.location.length == 0)) {
                        self.profile.location = item.profile.location;
                    }
                });
            }

            this.getFullProfileToPersist = function() {

                var response = {
                    keywords: self.keywords,
                    company_website: 'http://' + self.profile.email.split('@')[1].toLowerCase() + '/'
                };

                angular.forEach(self.linkedinProfiles, function (profile) {
                    if (profile.isSelected == true) {
                        if (profile.profile.summary) response.bio = profile.profile.summary;
                        if (profile.profile.pictureUrl) response.avatar = profile.profile.pictureUrl;
                    }
                });

                angular.forEach(self.twitterProfiles, function (profile) {
                    if (profile.isSelected == true) {
                        if (profile.profile.description && !response.bio) response.bio = profile.profile.description;
                        if (profile.profile.profile_image_url && !response.avatar) response.avatar = profile.profile.profile_image_url;
                    }
                });

                return response;
            }

            this.lookup = function() {
                var searchText = self.profile.name + ' ' + self.profile.surname;

                angular.forEach(['company', 'location'], function (field) {
                    if (self.profile[field] && self.profile[field].length > 0) {
                        searchText += ' ' + self.profile[field];
                    }
                });

                googleSearch
                    .query(searchText)
                    .success(function (data) {
                        if (data.error) throw 'GOOGLE SEARCH API ERROR: ' + data.error.message;
                        if (!data.items) data.items = [];
                        parseGoogleResults(data.items);
                    })
                    .error(function (err, code) {
                        console.log('GOOGLE SEARCH API ERROR', err, code);
                        googleResults = [];
                    });


            }

            this.twitterProfiles = [];
            this.linkedinProfiles = [];
            this.otherLinks = [];

            var parseGoogleResults = function (googleResults) {

                var twitterProfilesGained = 0;
                var linkedinProfilesGained = 0;
                var totalTwitterLinks = 0;
                var totalLinkedinLinks = 0;

                angular.forEach(googleResults, function (item) {

                    var isProcessed = false;

                    if (item.displayLink == 'twitter.com') {

                        angular.forEach(self.twitterProfiles, function (profile) {
                            if (profile.link == item.link) isProcessed = true;
                        });
                        if (isProcessed) return;

                        totalTwitterLinks++

                        //do it this way to preserve the google order of results
                        var profileIndex = self.twitterProfiles.push({
                            link: item.link
                        }) - 1;

                        $http
                            .get('/api/social/twitter?screen_name=' + item.link.replace('https://twitter.com/', ''), {cache: $angularCacheFactory.get('defaultCache')})
                            .success(function (profile) {

                                var keywords = [];

                                angular.forEach(profile.peerindex.topics, function (topic) {
                                    keywords.push({
                                        keyword: topic.name,
                                        weight: topic.topic_score / 100 //yahoo returns a weight from 0 to 1 so let's keep that format
                                    });
                                });

                                addProfile(profile.user, keywords);

                            })
                            .error(function () {
                                addProfile(null, []);
                            });

                        var addProfile = function (profile, keywords) {
                            self.twitterProfiles[profileIndex].profile = profile;
                            self.twitterProfiles[profileIndex].keywords = keywords;
                            self.twitterProfiles[profileIndex].isSelected = false;
                            twitterProfilesGained++;
                            if (twitterProfilesGained == totalTwitterLinks && linkedinProfilesGained == totalLinkedinLinks) {
                                self.linkedinProfiles = self.linkedinProfiles.filter(function(item) {
                                    return !!item;
                                });
                                userManager.totalUsersLoaded++;
                            }
                        }

                    } else if (item.formattedUrl.indexOf('linkedin.com') > -1) {

                        angular.forEach(self.linkedinProfiles, function (profile) {
                            if (profile.link == item.link) isProcessed = true;
                        });
                        if (isProcessed) return;

                        totalLinkedinLinks++;

                        //preserve the google order of results
                        var profileIndex = self.linkedinProfiles.push({
                            link: item.link
                        }) - 1;

                        $http
                            .get('/api/social/linkedin?profile_url=' + item.link, {cache: $angularCacheFactory.get('defaultCache')})
                            .success(function (profile) {

                                if (profile.firstName == 'private') {
                                    addProfile(null);
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
                                        profile.keywords = keywords;
                                        addProfile(profile);
                                    }, function () {
                                        addProfile(profile);
                                    });
                            })
                            .error(function () {
                                addProfile(null);
                            });

                        var addProfile = function (profile) {
                            if (!profile || profile.firstName == 'private') {
                                self.linkedinProfiles[profileIndex] = null;
                            } else {
                                self.linkedinProfiles[profileIndex].profile = profile;
                                self.linkedinProfiles[profileIndex].isSelected = false;
                            }

                            linkedinProfilesGained++;
                            if (twitterProfilesGained == totalTwitterLinks && linkedinProfilesGained == totalLinkedinLinks) {
                                self.linkedinProfiles = self.linkedinProfiles.filter(function(item) {
                                   return !!item;
                                });
                                userManager.totalUsersLoaded++;
                            }
                        }

                    } else {

                        angular.forEach(self.otherLinks, function (link) {
                            if (link == item.link) isProcessed = true;
                        });

                        if (!isProcessed) self.otherLinks.push(item);

                    }

                });

                if (totalTwitterLinks == 0 && totalLinkedinLinks == 0) userManager.totalUsersLoaded++;

            }
        }



    }]);