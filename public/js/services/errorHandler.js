/**
 * Global error handler
 */
angular.module('fyp.services')
    .service('errorHandler', ['$log', '$state', function ($log, $state) {

        var self = this;

        this.errors = [];

        //Handle non critical error
        this.handleError = function(message, code, headers, config) {
            self.errors.push(message);
            $log.error({message: message, code: code, headers: headers});
        }

        //Same as above but redirects to the start page
        this.handleCriticalError = function(message, code, headers, config) {
            self.handleError(message, code, headers, config);
            $state.go('app.addUsers');
        }

        //reset errors
        this.clearErrors = function() {
            self.errors = [];
        }

    }]);