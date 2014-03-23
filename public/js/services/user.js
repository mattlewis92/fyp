angular
    .module('fyp.services')
    .service('user', ['$http', '$q', '$angularCacheFactory', 'googleSearch', 'keywords', 'userManager', 'errorHandler', 'distance', 'linkedInProfile', 'twitterProfile', function ($http, $q, $angularCacheFactory, googleSearch, keywords, userManager, errorHandler, distance, linkedInProfile, twitterProfile) {

        return function(profile) {

            var self = this;

            this.id = null; //will be set when persisted
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
                self.persist();
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

                angular.forEach(self.matches, function(match, index) {
                    if (match.user.id == otherUser.id) self.matches.splice(index, 1);
                });

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
                    var match = {score: score, user: {id: otherUser.id, name: otherUser.profile.name + ' ' + otherUser.profile.surname}, intersecting_keywords: intersectingKeywords};
                    self.matches.push(match);

                }
            }

            this.updateOtherFieldsFromSocial = function() {
                self.linkedinProfiles.concat(self.twitterProfiles).forEach(function(profile) {
                    if (profile.isSelected && angular.isDefined(profile.profile.location.name) && (!angular.isDefined(self.profile.location) || self.profile.location.length == 0)) {
                        self.profile.location = profile.profile.location.name;
                    }
                });
            }

            this.persist = function() {

               var dataToSend = {
                   id: self.id,
                   name: self.profile.name,
                   surname: self.profile.surname,
                   company: self.profile.company,
                   location: self.profile.location,
                   group_name: userManager.currentGroup,
                   keywords: self.keywords,
                   twitter_profiles: self.twitterProfiles,
                   linked_in_profiles: self.linkedinProfiles,
                   other_links: self.other_links
               };

               return $http
                   .post('/api/user/save', {user: dataToSend})
                   .success(function(result) {
                       self.id = result.id;
                   })
                   .error(errorHandler.handleCriticalError);

            }

            this.lookup = function() {

                var deferred = $q.defer();

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

                        return self.persist();

                    })
                    .then(function() {
                        if (self.profile.twitterScreenName) {
                            self.twitterProfiles = [];
                            self
                                .addManualTwitterProfile('https://twitter.com/' + self.profile.twitterScreenName)
                                .finally(function() {
                                    userManager.totalUsersLoaded++;
                                    deferred.resolve(true);
                                });
                            delete self.profile.twitterScreenName; //stop it from being re-searched
                        } else {
                            userManager.totalUsersLoaded++;
                            deferred.resolve(true);
                        }
                    })
                    .catch(errorHandler.handleCriticalError);

                return deferred.promise;

            }

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
                    return score >= 0.75;
                }).length == matchingScores.length;

                return isProfile;
            }

            this.autoSelectProfiles = function() {

                self.linkedinProfiles.forEach(function(profile) {

                    var toCompareArr = [
                        {given: self.profile.name, found: profile.profile.firstName},
                        {given: self.profile.surname, found: profile.profile.lastName},
                        {given: self.profile.location, found: profile.profile.location ? profile.profile.location.name : ''},
                        {given: self.profile.company, found: (profile.profile.positions && profile.profile.positions.values) ? profile.profile.positions.values.map(function(item) {
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

            this.hasFoundProfileData = function() {

                if (self.linkedinProfiles.length == 0 && self.twitterProfiles.length == 0) {
                    return false;
                }

                var result = false;

                self.linkedinProfiles.forEach(function(profile) {

                    var toCompareArr = [
                        {given: self.profile.name, found: profile.profile.firstName},
                        {given: self.profile.surname, found: profile.profile.lastName}
                    ];

                    if (doesProfileMatch(toCompareArr)) result = true;

                });

                self.twitterProfiles.forEach(function(profile) {
                    var toCompareArr = [
                        {given: self.profile.name + ' ' + self.profile.surname, found: profile.profile.name}
                    ];

                    if (doesProfileMatch(toCompareArr)) result = true;
                });

                return result;

            }

            this.addManualLinkedInProfile = function(profileUrl) {
                return linkedInProfile
                    .extractFromUrl(profileUrl)
                    .then(function(profile) {
                        profile.isSelected = false;
                        self.linkedinProfiles.push(profile);
                        self.autoSelectProfiles();
                        self.persist();
                    });
            }

            this.addManualTwitterProfile = function(profileUrl) {
                return twitterProfile
                    .extractFromUrl(profileUrl)
                    .then(function(profile) {
                        profile.isSelected = false;
                        self.twitterProfiles.push(profile);
                        self.autoSelectProfiles();
                        self.persist();
                    });
            }

        }



    }]);