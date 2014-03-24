angular.module('fyp.directives', []);
angular.module('fyp.controllers', []);
angular.module('fyp.services', []);
angular.module('fyp.filters', []);
angular.module('fyp.config', []);
angular.module('fyp', [
    'ui.router',
    'ui.bootstrap',
    'jmdobry.angular-cache',
    'fyp.config',
    'fyp.directives',
    'fyp.controllers',
    'fyp.filters',
    'fyp.services'
]);