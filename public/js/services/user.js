/**
 * User model
 */
angular
    .module('fyp.services')
    .service('user', ['$http', '$q', '$angularCacheFactory', 'googleSearch', 'keywords', 'userManager', 'errorHandler', 'distance', 'cosineSimilarity', 'linkedInProfile', 'twitterProfile', function ($http, $q, $angularCacheFactory, googleSearch, keywords, userManager, errorHandler, distance, cosineSimilarity, linkedInProfile, twitterProfile) {

        return function(profile) {

            var self = this;

            this.id = null; //will be set when persisted
            this.profile = profile;
            this.keywords = {};
            this.twitterProfiles = [];
            this.linkedinProfiles = [];
            this.otherLinks = [];
            this.matches = [];

            //Toggle select a social media profile
            this.toggleProfile = function(profile) {
                profile.isSelected = !profile.isSelected;
                self.updateKeywords();
                self.updateOtherFieldsFromSocial();
                return self.persist();
            }

            //Update a users keyword cloud and subsequantly they're matches
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

            //Function that finds matches between users using TF:IDF and cosine similarity
            this.findSimilarityScoreBetweenUsers = function(otherUser) {

                angular.forEach(self.matches, function(match, index) {
                    if (match.user.id == otherUser.id) self.matches.splice(index, 1);
                });

                var thisUsersKeywords = self.keywords;
                var otherUsersKeywords = otherUser.keywords;

                var vector1 = [];
                var vector2 = [];

                //calculate the total documents for a given list of keywords
                var calculateDocumentLength = function(keywords) {
                    var documentLength = 0;
                    angular.forEach(keywords, function(count) {
                        documentLength += count;
                    });
                    return documentLength;
                }

                //pre-calculate it here for performance
                var user1DocumentLength = calculateDocumentLength(thisUsersKeywords);
                var user2DocumentLength = calculateDocumentLength(otherUsersKeywords);
                var totalDocumentCount = userManager.users.length;

                //Find the total number of documents with this term
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

                    //normalize the term frequency into a value between 0 and 1
                    var user1TermFrequencyNormalized = thisUserCount / user1DocumentLength;
                    var user2TermFrequencyNormalized = otherUserWordCount / user2DocumentLength;

                    var documentInfrequency = Math.log(totalDocumentCount / totalDocumentsWithTerm(word));

                    vector1.push(user1TermFrequencyNormalized * documentInfrequency);
                    vector2.push(user2TermFrequencyNormalized * documentInfrequency);
                });

                //Compute the cosine similarity between the 2 vectors
                var score = cosineSimilarity(vector1, vector2);
                if (score) {
                    var match = {score: score, user: {id: otherUser.id, name: otherUser.profile.name + ' ' + otherUser.profile.surname}, intersecting_keywords: intersectingKeywords};
                    self.matches.push(match);
                }
            }

            //If we've found location, company etc from the users social media account then update their profile
            this.updateOtherFieldsFromSocial = function() {
                self.linkedinProfiles.concat(self.twitterProfiles).forEach(function(profile) {
                    if (profile.isSelected && angular.isDefined(profile.profile.location.name) && (!angular.isDefined(self.profile.location) || self.profile.location.length == 0)) {
                        self.profile.location = profile.profile.location.name;
                    }
                });
            }

            //Save a user to mongodb
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

            //This actually does the searching for a user
            this.lookup = function() {

                var deferred = $q.defer();

                //build the search string
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

                        //If we got passed a twitter handle in the CSV then add it to the profile
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
                            //otherwise auto select profiles and mark this user as loaded
                            self
                                .autoSelectProfiles()
                                .finally(function() {
                                    userManager.totalUsersLoaded++;
                                    deferred.resolve(true);
                                });
                        }
                    })
                    .catch(errorHandler.handleCriticalError);

                return deferred.promise;

            }

            //Compare a set of passed in fields using jaro winkler string distance to make a guess at if this is the correct user
            var doesProfileMatch = function(toCompareArr) {
                var matchingScores = [];

                toCompareArr.forEach(function(toCompare) {
                    if (toCompare.given && toCompare.found) {

                        if (typeof toCompare.found == 'object') { //if an array of fields just look for one match and keep the highest
                            var highestScore = 0;
                            toCompare.found.forEach(function(item) {
                                var jwd = distance.jaroWinker(toCompare.given, item);
                                if (jwd > highestScore) highestScore = jwd;
                            });
                            matchingScores.push(highestScore);
                        } else {
                            //else just add the score to the count
                            matchingScores.push(distance.jaroWinker(toCompare.given, toCompare.found));
                        }
                    }
                });

                //if all scores are > 0.75 then this is said to be the correct profile found
                var isProfile = matchingScores.length > 0 && matchingScores.filter(function(score) {
                    return score >= 0.75;
                }).length == matchingScores.length;

                return isProfile;
            }

            //make a best guess to auto select profiles using string distance
            this.autoSelectProfiles = function() {

                var promises = [];

                //Auto select linkedin profiles
                self.linkedinProfiles.forEach(function(profile) {

                    var toCompareArr = [
                        {given: self.profile.name, found: profile.profile.firstName},
                        {given: self.profile.surname, found: profile.profile.lastName},
                        {given: self.profile.location, found: profile.profile.location ? profile.profile.location.name : ''},
                        {given: self.profile.company, found: (profile.profile.positions && profile.profile.positions.values) ? profile.profile.positions.values.map(function(item) {
                            return item.company.name
                        }) : null}
                    ];

                    if (doesProfileMatch(toCompareArr) && !profile.isSelected) {
                        promises.push(self.toggleProfile(profile));
                    }

                });

                //auto select twitter profiles
                self.twitterProfiles.forEach(function(profile) {
                    var toCompareArr = [
                        {given: self.profile.name + ' ' + self.profile.surname, found: profile.profile.name},
                        {given: self.profile.location, found: profile.profile.location}
                    ];

                    if (doesProfileMatch(toCompareArr) && !profile.isSelected) {
                        promises.push(self.toggleProfile(profile));
                    }
                });

                return $q.allSettled(promises);

            }

            //Used for telling if any useful info was actually found for a user
            this.hasFoundProfileData = function() {

                //if no linkedin and no twitter profiles then say no
                if (self.linkedinProfiles.length == 0 && self.twitterProfiles.length == 0) {
                    return false;
                }

                var result = false;

                //check for potential matches of users just based on name and not other fields
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

            //manually add a linkedin profile
            this.addManualLinkedInProfile = function(profileUrl) {
                return linkedInProfile
                    .extractFromUrl(profileUrl)
                    .then(function(profile) {
                        profile.isSelected = false;
                        self.linkedinProfiles.push(profile);
                        return self.autoSelectProfiles();
                    });
            }

            //manually add a twitter profiel
            this.addManualTwitterProfile = function(profileUrl) {
                return twitterProfile
                    .extractFromUrl(profileUrl)
                    .then(function(profile) {
                        profile.isSelected = false;
                        self.twitterProfiles.push(profile);
                        return self.autoSelectProfiles();
                    });
            }

        }



    }]);