/**
 * Computes the distance between 2 given strings
 * Adapted from: https://raw.github.com/NaturalNode/natural/master/lib/natural/distance/jaro-winkler_distance.js
 */
angular.module('fyp.services')
    .service('distance', function() {

        // Computes the Jaro distance between two string -- intrepreted from:
        // http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
        // s1 is the first string to compare
        // s2 is the second string to compare
        function distance(s1, s2) {
            if (typeof(s1) != "string" || typeof(s2) != "string") return 0;
            if (s1.length == 0 || s2.length == 0)
                return 0;
            s1 = s1.toLowerCase(), s2 = s2.toLowerCase();
            var matchWindow = (Math.floor(Math.max(s1.length, s2.length) / 2.0)) - 1;
            var matches1 = new Array(s1.length);
            var matches2 = new Array(s2.length);
            var m = 0; // number of matches
            var t = 0; // number of transpositions

            //debug helpers
            //console.log("s1: " + s1 + "; s2: " + s2);
            //console.log(" - matchWindow: " + matchWindow);

            // find matches
            for (var i = 0; i < s1.length; i++) {
                var matched = false;

                // check for an exact match
                if (s1[i] ==  s2[i]) {
                    matches1[i] = matches2[i] = matched = true;
                    m++
                }

                // check the "match window"
                else {
                    // this for loop is a little brutal
                    for (k = (i <= matchWindow) ? 0 : i - matchWindow;
                         (k <= i + matchWindow) && k < s2.length && !matched;
                         k++) {
                        if (s1[i] == s2[k]) {
                            if(!matches1[i] && !matches2[k]) {
                                m++;
                            }

                            matches1[i] = matches2[k] = matched = true;
                        }
                    }
                }
            }

            if(m == 0)
                return 0.0;

            // count transpositions
            var k = 0;

            for(var i = 0; i < s1.length; i++) {
                if(matches1[k]) {
                    while(!matches2[k] && k < matches2.length)
                        k++;
                    if(s1[i] != s2[k] &&  k < matches2.length)  {
                        t++;
                    }

                    k++;
                }
            }

            //debug helpers:
            //console.log(" - matches: " + m);
            //console.log(" - transpositions: " + t);
            t = t / 2.0;
            return (m / s1.length + m / s2.length + (m - t) / m) / 3;
        }

        this.jaroWinker = function(s1, s2) {
            var jaro = distance(s1,s2);
            var p = 0.1; //
            var l = 0; // length of the matching prefix

            while(s1[l] == s2[l] && l < 4)
                l++;

            return jaro + l * p * (1 - jaro);
        }

    });