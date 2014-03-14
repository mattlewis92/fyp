angular
    .module('fyp.services')
    .service('user', ['$http', '$q', '$angularCacheFactory', 'googleSearch', 'keywords', 'userManager', 'errorHandler', 'distance', function ($http, $q, $angularCacheFactory, googleSearch, keywords, userManager, errorHandler, distance) {

        //from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
        var generateId = function(uniqueString) {
            var hash = 0, i, char;
            if (uniqueString.length == 0) return hash;
            for (i = 0, l = uniqueString.length; i < l; i++) {
                char  = uniqueString.charCodeAt(i);
                hash  = ((hash<<5)-hash)+char;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }

        return function(profile) {

            var self = this;

            this.id = generateId(profile.email);
            this.profile = profile;
            this.keywords = {};
            this.twitterProfiles = [];
            this.linkedinProfiles = [];
            this.otherLinks = [];
            this.matches = [];

            this.toggleProfile = function(profile) {
                profile.isSelected = !profile.isSelected;
                self.updateKeywords();
                self.updateOtherFieldsFromSocial();
            }

            this.updateKeywords = function() {

                self.keywords = {};

                self.linkedinProfiles.concat(self.twitterProfiles).forEach(function(profile) {
                    if (profile.isSelected == true) {
                        self.keywords = keywords.concatLists(self.keywords, profile.keywords);
                    }
                });

                userManager.users.forEach(function(otherUser) {
                    if ( self.id != otherUser.id && !angular.equals(otherUser.keywords, {})) {
                        self.findSimilarityScoreBetweenUsers(otherUser);
                        otherUser.findSimilarityScoreBetweenUsers(self);
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

                var intersectingKeywords = [];

                angular.forEach(thisUsersKeywords, function(thisUserCount, word) {
                    var otherUserWordCount = otherUsersKeywords[word];
                    if (!otherUserWordCount) {
                        otherUserWordCount = 0;
                    } else {
                        intersectingKeywords.push(word);
                    }

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
                if (score) {

                    var matchIndex = null;
                    angular.forEach(self.matches, function(match, index) {
                        if (match.user.id == otherUser.id) matchIndex = index;
                    });
                    var match = {score: score, user: {id: otherUser.id, name: otherUser.profile.name + ' ' + otherUser.profile.surname}, intersecting_keywords: intersectingKeywords};

                    if (matchIndex !== null) {
                        self.matches[matchIndex] = match;
                    } else {
                        self.matches.push(match);
                    }

                }
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

            this.autoSelectProfiles = function() {

                var doesProfileMatch = function(toCompareArr) {
                    var matchingScores = [];

                    toCompareArr.forEach(function(toCompare) {
                        if (toCompare.given && toCompare.found) {

                            if (typeof toCompare.found == 'object') {
                                var highestScore = 0;
                                toCompare.found.forEach(function(item) {
                                    var jwd = distance.jaroWinker(toCompare.given, item);
                                    if (jwd > highestScore) highestScore = jwd;
                                });
                                matchingScores.push(highestScore);
                            } else {
                                matchingScores.push(distance.jaroWinker(toCompare.given, toCompare.found));
                            }
                        }
                    });

                    var isProfile = matchingScores.length > 0 && matchingScores.filter(function(score) {
                        return score >= 0.8;
                    }).length == matchingScores.length;

                    return isProfile;
                }

                self.linkedinProfiles.forEach(function(profile) {

                    var toCompareArr = [
                        {given: self.profile.name, found: profile.profile.firstName},
                        {given: self.profile.surname, found: profile.profile.lastName},
                        {given: self.profile.location, found: profile.profile.location.name},
                        {given: self.profile.company, found: profile.profile.positions.values ? profile.profile.positions.values.map(function(item) {
                            return item.company.name
                        }) : null}
                    ];

                    if (doesProfileMatch(toCompareArr) && !profile.isSelected) self.toggleProfile(profile);

                });

                self.twitterProfiles.forEach(function(profile) {
                    var toCompareArr = [
                        {given: self.profile.name + ' ' + self.profile.surname, found: profile.profile.name},
                        {given: self.profile.location, found: profile.profile.location}
                    ];

                    if (doesProfileMatch(toCompareArr) && !profile.isSelected) self.toggleProfile(profile);
                });
            }

        }



    }]);