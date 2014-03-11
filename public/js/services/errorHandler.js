angular.module('fyp.services')
    .service('errorHandler', ['$log', '$state', function ($log, $state) {

        var self = this;

        this.errors = [];

        this.handleError = function(message, code, headers, config) {
            self.errors.push(message);
            $log.error({message: message, code: code, headers: headers});
        }

        this.handleCriticalError = function(message, code, headers, config) {
            self.handleError(message, code, headers, config);
            $state.go('app.addUsers');
        }

        this.clearErrors = function() {
            self.errors = [];
        }

    }]);