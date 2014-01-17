'use strict';

angular.module('userData.controllers', []).
  controller(
    'IndexCtrl', ['$scope', '$http', '$route', '$q', '$angularCacheFactory', 'googleSearch', 'keywords', 'crawler', 'csv', function($scope, $http, $route, $q, $angularCacheFactory, googleSearch, keywords, crawler, csv) {
    $scope.lookupUser = function(index) {

      $scope.processingUsers = true;
      $scope.usersProcessed = false;

      $scope.users[index].selectedKeywords = [];

      var searchText = $scope.users[index].name + ' ' + $scope.users[index].surname;

      angular.forEach(['company', 'location'], function(field) {
        if ($scope.users[index][field] && $scope.users[index][field].length > 0) {
          searchText += ' ' + $scope.users[index][field];
        }
      });

      googleSearch
        .query(searchText)
        .success(function(data) {
          if (data.error) throw 'GOOGLE SEARCH API ERROR: ' + data.error.message;
          if (!data.items) data.items = [];
          $scope.users[index].googleResults = data.items;
          parseGoogleResults(index);
        })
        .error(function(err, code) {
          console.log('GOOGLE SEARCH API ERROR', err, code);
          $scope.users[index].googleResults = [];
        });

      if (!angular.isDefined($scope.users[index].websiteKeywords)) {

        $scope.users[index].companyWebsite = 'http://' + $scope.users[index].email.split('@')[1] + '/';
        $scope.users[index].websiteKeywords = [];
        $scope.users[index].customKeywords = [];

        if ($scope.users[index].email.indexOf('yahoo') > -1 || $scope.users[index].email.indexOf('hotmail') > -1 || $scope.users[index].email.indexOf('gmail') > -1 || true) { //disabled the crawler
          $scope.users[index].companyWebsite = null;
        } else {
          crawler
            .crawl($scope.users[index].companyWebsite)
            .success(function(data) {
              $scope.users[index].websitePages = data;

              var text = [];
              angular.forEach(data, function(page) {
                text.push(page.content);
              });

              keywords
                .extract(text)
                .then(function(keywords) {
                  $scope.users[index].websiteKeywords = $scope.users[index].websiteKeywords.concat(keywords);
                  $scope.updateKeywords($scope.users[index]);
                }, function(err) {
                });

            });
        }

      }

    }

    var randomize = function(arr) {
      for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
      return arr;
    }

    var parseGoogleResults = function(userIndex) {

      if(!angular.isDefined($scope.users[userIndex].googleResults)) throw 'You cant call this function before querying google';

      var twitterProfilesGained = 0;
      var linkedinProfilesGained = 0;
      var totalTwitterLinks = 0;
      var totalLinkedinLinks = 0;

      angular.forEach($scope.users[userIndex].googleResults, function(item) {

        var isProcessed = false;

        if(item.displayLink == 'twitter.com') {

          $scope.users[userIndex].twitterProfiles = angular.isDefined($scope.users[userIndex].twitterProfiles) ? $scope.users[userIndex].twitterProfiles : [];

          angular.forEach($scope.users[userIndex].twitterProfiles, function(profile) {
            if (profile.link == item.link) isProcessed = true;
          });
          if (isProcessed) return;

          totalTwitterLinks++

          //do it this way to preserve the google order of results
          var profileIndex = $scope.users[userIndex].twitterProfiles.push({
            link: item.link
          }) - 1;

          $http
            .get('/link/twitter?screen_name=' + item.link.replace('https://twitter.com/', ''), {cache: $angularCacheFactory.get('defaultCache')})
            .success(function(profile) {

              var keywords = [];

              angular.forEach(profile.peerindex.topics, function(topic) {
                keywords.push({
                  keyword: topic.name,
                  weight: topic.topic_score / 100 //yahoo returns a weight from 0 to 1 so let's keep that format
                });
              });

              addProfile(profile.user, keywords);

            })
            .error(function() {
              addProfile(null, []);
            });

            var addProfile = function(profile, keywords) {
              $scope.users[userIndex].twitterProfiles[profileIndex].profile = profile;
              $scope.users[userIndex].twitterProfiles[profileIndex].keywords = keywords;
              $scope.users[userIndex].twitterProfiles[profileIndex].isSelected = false;
              twitterProfilesGained++;
              if (twitterProfilesGained == totalTwitterLinks && linkedinProfilesGained == totalLinkedinLinks) $scope.totalUsersLoaded++;
            }

        } else if(item.formattedUrl.indexOf('linkedin.com') > -1) {

          $scope.users[userIndex].linkedinProfiles = angular.isDefined($scope.users[userIndex].linkedinProfiles) ? $scope.users[userIndex].linkedinProfiles : [];

          angular.forEach($scope.users[userIndex].linkedinProfiles, function(profile) {
            if (profile.link == item.link) isProcessed = true;
          });
          if (isProcessed) return;

          totalLinkedinLinks++;

          //preserve the google order of results
          var profileIndex = $scope.users[userIndex].linkedinProfiles.push({
            link: item.link
          }) - 1;

          $http
            .get('/link/linkedin?profile_url=' + item.link, {cache: $angularCacheFactory.get('defaultCache')})
            .success(function(profile) {

              if (profile.firstName == 'private') {
                addProfile(null);
                return;
              }

              var text = [];
              angular.forEach(['summary', 'headline', 'industry'], function(field) {
                if (angular.isDefined(profile[field])) text.push(profile[field]);
              });
              angular.forEach(profile.positions.values, function(position) {
                if (position.summary) text.push(position.summary);
              });

              keywords
                .extract(text)
                .then(function(keywords) {
                  profile.keywords = keywords;
                  addProfile(profile);
                },function() {
                  addProfile(profile);
                });
            })
            .error(function() {
              addProfile(null);
            });

          var addProfile = function(profile) {
            $scope.users[userIndex].linkedinProfiles[profileIndex].profile = profile;
            $scope.users[userIndex].linkedinProfiles[profileIndex].isSelected = false;
            linkedinProfilesGained++;
            if (twitterProfilesGained == totalTwitterLinks && linkedinProfilesGained == totalLinkedinLinks) $scope.totalUsersLoaded++;
          }

        } else {

          $scope.users[userIndex].otherLinks = angular.isDefined($scope.users[userIndex].otherLinks) ? $scope.users[userIndex].otherLinks : [];

          angular.forEach($scope.users[userIndex].otherLinks, function(link) {
            if (link == item.link) isProcessed = true;
          });

          if (!isProcessed) $scope.users[userIndex].otherLinks.push(item);

        }

      });

      if (totalTwitterLinks == 0 && totalLinkedinLinks == 0) $scope.totalUsersLoaded++;

    }

    $scope.totalUsersLoaded = 0;

    $scope.users = [];

    $scope.showSingleUserForm = false;

    $scope.currentUserIndex = 0;

    $scope.newKeyword = {};

    $scope.lookupUsers = function() {

      $scope.totalUsersLoaded = 0;

      angular.forEach($scope.users, function(user, index) {
        $scope.lookupUser(index);
      });

    }

    $scope.linkedinAuthenticated = $route.current.params.linkedin == 'authenticated';

    $scope.updateKeywords = function(user) {

      user.selectedKeywords = keywords.concatLists([], user.websiteKeywords);
      user.selectedKeywords = keywords.concatLists(user.selectedKeywords, user.customKeywords);

      angular.forEach(user.linkedinProfiles, function(profile) {
        if (profile.isSelected == true) {
          user.selectedKeywords = keywords.concatLists(user.selectedKeywords, profile.profile.keywords);
        }
      });

      angular.forEach(user.twitterProfiles, function(profile) {
        if (profile.isSelected == true) {
          user.selectedKeywords = keywords.concatLists(user.selectedKeywords, profile.keywords);
        }
      });

      for (var i in $scope.users) {
        $scope.users[i].matches = $scope.getUserMatches($scope.users[i]);

        $scope.users[i].matchedEmails = [];
        angular.forEach($scope.users[i].matches, function(match) {
          $scope.users[i].matchedEmails.push(match.user.email);
        });
      }

    }

    $scope.editKeyword = function(user, keyword, newWeight) {

      newWeight = parseFloat(newWeight);

      for (var i in user.customKeywords) {
        if (user.customKeywords[i].keyword.toLowerCase() == keyword.toLowerCase()) {
          user.customKeywords[i].weight = newWeight;
        }
      }

      for (var i in user.websiteKeywords) {
        if (user.websiteKeywords[i].keyword.toLowerCase() == keyword.toLowerCase()) {
          user.websiteKeywords[i].weight = newWeight;
        }
      }

      for (var i in user.linkedinProfiles) {
        if (user.linkedinProfiles[i].profile) {
          for (var j in user.linkedinProfiles[i].profile.keywords) {
            if (user.linkedinProfiles[i].profile.keywords[j].keyword.toLowerCase() == keyword.toLowerCase()) {
              user.linkedinProfiles[i].profile.keywords[j].weight = newWeight;
            }
          }
        }
      }

      for (var i in user.twitterProfiles) {
        for (var j in user.twitterProfiles[i].keywords) {
          if (user.twitterProfiles[i].keywords[j].keyword.toLowerCase() == keyword.toLowerCase()) {
            user.twitterProfiles[i].keywords[j].weight = newWeight;
          }
        }
      }

      $scope.updateKeywords(user);
    }

    $scope.updateOtherFieldsFromSocial = function(user) {

      angular.forEach(user.linkedinProfiles, function(item) {
        if (item.isSelected && angular.isDefined(item.profile.location.name) && (!angular.isDefined(user.location) || user.location.length == 0)) {
          user.location = item.profile.location.name;
        }
      });

      angular.forEach(user.twitterProfiles, function(item) {
        if (item.isSelected && angular.isDefined(item.profile.location) && (!angular.isDefined(user.location) || user.location.length == 0)) {
          user.location = item.profile.location;
        }
      });

    }

    $scope.getTotalViewableLinkedinProfiles = function(user) {
      var count = 0;

      if (angular.isDefined(user)) {
        angular.forEach(user.linkedinProfiles, function(profile) {
          if (profile && profile.firstName != 'private') count++;
        });
      }

      return count;
    }

    $scope.getUserMatches = function(user1) {
      var matches = [];

      angular.forEach($scope.users, function(user2, user2Index) {
        var score = 0;
        var keywords = [];
        if (user1.email != user2.email) {

          angular.forEach(user1.selectedKeywords, function(user1Keyword) {
            angular.forEach(user2.selectedKeywords, function(user2Keyword) {
              if (user1Keyword.keyword == user2Keyword.keyword) {
                score += (user1Keyword.weight + user2Keyword.weight) / 2; //add the average of the 2 weights to the score.
                keywords.push(user1Keyword.keyword);
              }
            });
          });

        }

        if (score > 0) {
          matches.push({
            score: score,
            user: user2,
            userIndex: user2Index,
            keywords: keywords
          });
        }
      });

      return matches;
    }

    $scope.switchUser = function(newIndex) {
      $scope.currentUserIndex = newIndex;
    }

    $scope.showSummary = false;

    $scope.matches = [];

    $scope.addMatch = function(user1, user2) {
      if (!$scope.hasMatch(user1, user2)) {
        $scope.matches.push([user1, user2]);
      }
    }

    $scope.removeMatch = function(user1, user2) {
      if ($scope.hasMatch(user1, user2)) {
        $scope.matches.splice($scope.getMatchIndex(user1, user2), 1);
      }
    }

    $scope.hasMatch = function(user1, user2) {
      return $scope.getMatchIndex(user1, user2) != null;
    }

    $scope.getMatchIndex = function(user1, user2) {
      var result = null;
      angular.forEach($scope.matches, function(match, index) {
        if (match[0].email == user1.email && match[1].email == user2.email) {
          result = index;
        } else if (match[1].email == user1.email && match[0].email == user2.email) {
          result = index;
        }
      });
      return result;
    }

    $scope.getMatches = function(user) {
      var result = [];
      angular.forEach($scope.matches, function(match) {
        if (match[0].email == user.email) result.push(match[1]);
        if (match[1].email == user.email) result.push(match[0]);
      });
      return result;
    }

    $scope.getUserPersistentData = function(user) {
      var response = {
        _id: user._id,
        interests: [],
        company_website: 'http://' + user.email.split('@')[1].toLowerCase() + '/'
      };

      angular.forEach(user.selectedKeywords, function(keyword) {
        response.interests.push({
          value: keyword.keyword,
          weight: keyword.weight
        });
      });

      angular.forEach(user.linkedinProfiles, function(profile) {
        if (profile.isSelected == true) {
          if (profile.profile.summary) response.bio = profile.profile.summary;
          if (profile.profile.pictureUrl) response.avatar = profile.profile.pictureUrl;
        }
      });

      angular.forEach(user.twitterProfiles, function(profile) {
        if (profile.isSelected == true) {
          if (profile.profile.description && !response.bio) response.bio = profile.profile.description;
          if (profile.profile.profile_image_url && !response.avatar) response.avatar = profile.profile.profile_image_url;
        }
      });

      return response;

    }

    $scope.$watch('totalUsersLoaded', function(newValue) {
      if (newValue == $scope.users.length && $scope.users.length > 0) {
        $scope.processingUsers = false;
        $scope.usersProcessed = true;
      }
    });

    $scope.$watch('csv', function(newValue) {

      if(newValue) {
        var csvData = csv.parse(newValue);

        angular.forEach(csvData, function(line) {

          if (line.length > 1) {
            $scope.users.push({
              name: line[1],
              surname: line[2],
              email: line[5],
              company: line[4]
            });
          }

        });

      }

    });

  }]);