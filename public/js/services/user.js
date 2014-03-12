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

                userManager.users.forEach(function(otherUser) {
                    if ( !angular.equals(self, otherUser) ) {
                        self.findSimilarityScoreBetweenUsers(otherUser);
                    };
                });

            }

            this.findSimilarityScoreBetweenUsers = function(otherUser) {
                var thisUsersKeywords = self.keywords;
                var otherUsersKeywords = otherUser.keywords;

                var vector1 = [];
                var vector2 = [];

                var calculateDocumentLength = function(keywords) {
                    var documentLength = 0;
                    angular.forEach(keywords, function(count) {
                        documentLength += count;
                    });
                    return documentLength;
                }

                var user1DocumentLength = calculateDocumentLength(thisUsersKeywords);
                var user2DocumentLength = calculateDocumentLength(otherUsersKeywords);
                var totalDocumentCount = userManager.users.length;

                var totalDocumentsWithTerm = function(term) {
                    return userManager.users.reduce(function(acc, user) {
                        return acc + (user.keywords[term] ? 1 : 0);
                    }, 0);
                }

                angular.forEach(thisUsersKeywords, function(thisUserCount, word) {
                    var otherUserWordCount = otherUsersKeywords[word];
                    if (!otherUserWordCount) otherUserWordCount = 0;

                    var user1TermFrequencyNormalized = thisUserCount / user1DocumentLength;
                    var user2TermFrequencyNormalized = otherUserWordCount / user2DocumentLength;

                    var documentInfrequency = Math.log(totalDocumentCount / totalDocumentsWithTerm(word));

                    vector1.push(user1TermFrequencyNormalized * documentInfrequency);
                    vector2.push(user2TermFrequencyNormalized * documentInfrequency);
                });

                var absVector = function(vector) {
                    return Math.sqrt(vector.reduce(function(previousValue, currentValue) {
                        return previousValue + (currentValue * currentValue);
                    }, 0));
                }

                var dotProduct = function(vector1, vector2) {
                    return vector1.reduce(function(previousValue, currentValue, index) {
                        return previousValue + (currentValue * vector2[index]);
                    }, 0);
                }

                var score = dotProduct(vector1, vector2) / (absVector(vector1) * absVector(vector2));
                if (score) console.log(self.profile.name, 'AND', otherUser.profile.name, score);
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