angular
    .module('fyp.services')
    .service('user', ['$http', '$q', '$angularCacheFactory', 'googleSearch', 'keywords', 'userManager', 'errorHandler', function ($http, $q, $angularCacheFactory, googleSearch, keywords, userManager, errorHandler) {

        return function(profile) {

            var self = this;

            this.profile = profile;
            this.keywords = {};
            this.twitterProfiles = [];
            this.linkedinProfiles = [];
            this.otherLinks = [];

            this.updateKeywords = function() {

                self.keywords = {};

                self.linkedinProfiles.concat(self.twitterProfiles).forEach(function(profile) {
                    if (profile.isSelected == true) {
                        self.keywords = keywords.concatLists(self.keywords, profile.keywords);
                    }
                });

            }

            this.updateOtherFieldsFromSocial = function() {
                self.linkedinProfiles.concat(self.twitterProfiles).forEach(function(profile) {
                    if (profile.isSelected && angular.isDefined(profile.profile.location.name) && (!angular.isDefined(self.profile.location) || self.profile.location.length == 0)) {
                        self.profile.location = profile.profile.location.name;
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
                    .then(function (result) {
                        self.twitterProfiles = result.twitterProfiles;
                        self.linkedinProfiles = result.linkedInProfiles;
                        self.otherLinks = result.otherLinks;
                        userManager.totalUsersLoaded++;
                    })
                    .catch(errorHandler.handleCriticalError);

            }

        }



    }]);