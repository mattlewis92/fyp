'use strict';

angular.module('fyp.directives')

    .run(['$templateCache', function($templateCache) {

        var selectHtml="";
        selectHtml += "<div class=\"btn-group dropdown\" ng-keydown=\"onKeydown($event)\" is-open=\"isopen\" on-toggle=\"onToggle()\" role=\"combobox\" aria-activedescendant=\"{{activeOption.id}}\">";
        selectHtml += "    <button type=\"button\" class=\"btn dropdown-toggle\" ng-class=\"['btn-' + (type || 'default'), size && ('btn-' + size)]\" ng-disabled=\"isDisabled\" style=\"width:100%;\">";
        selectHtml += "        <span placeholder-empty ng-if=\"isEmpty()\" empty-placeholder-text=\"{{emptyPlaceholderText}}\"><\/span>";
        selectHtml += "        <span ng-if=\"!isEmpty() && !multiple\" select-option=\"selectedOption.label\" template-url=\"optionTemplateUrl\"><\/span>";
        selectHtml += "        <span ng-if=\"!isEmpty() && multiple\" ng-repeat=\"option in selectedOption track by $index\"><span select-option=\"option.label\" template-url=\"optionTemplateUrl\"><\/span><span ng-if=\"!$last\">, <\/span><\/span>";
        selectHtml += "        <span class=\"caret\"><\/span>";
        selectHtml += "    <\/button>";
        selectHtml += "    <ul class=\"dropdown-menu\" style=\"width:100%;\" ng-click=\"prevent($event)\" role=\"listbox\" ng-if=\"isopen\">";
        selectHtml += "        <li ng-if=\"filter.enabled\" style=\"padding: 0px 5px 5px 5px;\"><input class=\"form-control\" type=\"search\" style=\"width: 100%\" ng-model=\"filter.value\" ng-change=\"filterChange()\" aria-readonly=\"true\" aria-activedescendant=\"{{activeOption.id}}\"><\/li>";
        selectHtml += "        <li ng-repeat-start=\"(groupName, group) in groups track by $index\" class=\"dropdown-header\" ng-if=\"groupName\">{{groupName}}<\/li>";
        selectHtml += "        <li></li><li ng-repeat=\"option in group.options track by $index\" ng-class=\"{active: isActive(option)}\" role=\"option\" ng-click=\"select(option, $event)\" ng-if=\"option.valid\" id=\"{{option.id}}\" aria-selected=\"{{!!option.selected}}\">";
        selectHtml += "            <a href tabindex=\"-1\" select-option=\"option.label\" template-url=\"optionTemplateUrl\">";
        selectHtml += "                <i ng-if=\"multiple && option.selected\" class=\"glyphicon glyphicon-ok pull-right\"><\/i>";
        selectHtml += "            <\/a>";
        selectHtml += "        <\/li>";
        selectHtml += "        <li class=\"divider\" ng-if=\"!$last\" ng-repeat-end><\/li>";
        selectHtml += "    <\/ul>";
        selectHtml += "<\/div>";


        $templateCache.put('option.html', '<span>{{option}}</span>');
        $templateCache.put('placeholder-empty.html', '<span>{{getEmptyText()}}</span>');
        $templateCache.put('select.html', selectHtml);

    }])

    .constant('dropdownSelectConfig', {
        emptyPlaceholderText: 'Nothing selected'
    })

    .factory('optionsParser', ['$parse', function ($parse) {

        var DROPDOWN_REGEXP   = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;
        return {
            parse:function (input) {
                var match = input.match(DROPDOWN_REGEXP);
                if (!match) {
                    throw new Error(
                        'Expected dropdown specification in form of "_viewValue_ (as _label_)? (group by _groupname_)? for _item_ in _collection_"' +
                            ' but got "' + input + '".');
                }

                var valueName = match[4] || match[6];
                return {
                    displayFn: $parse(match[2] || match[1]),
                    valueName: valueName,
                    keyName: match[5],
                    groupByFn: $parse(match[3] || ''),
                    valueFn: $parse(match[2] ? match[1] : valueName),
                    valuesFn: $parse(match[5])
                };
            }
        };
    }])

    .controller('DropdownSelectController', ['$scope', '$attrs', 'optionsParser', 'dropdownSelectConfig', 'filterFilter', '$timeout',
        function($scope, $attrs, optionsParser, dropdownSelectConfig, filterFilter, $timeout) {
            var self = this,
                parserResult = optionsParser.parse($attrs.ngOptions),
                ngModelCtrl  = { $setViewValue: angular.noop },
                element;

            $scope.multiple = angular.isDefined($attrs.multiple) ? $scope.$parent.$eval($attrs.multiple) : false;
            $scope.filter = {
                enabled: angular.isDefined($attrs.filter) ? $scope.$parent.$eval($attrs.filter) : false,
                value: '',
                key: $scope.filterKey
            };
            $scope.options = [];

            this.init = function(ngModelCtrl_, element_) {
                ngModelCtrl = ngModelCtrl_;
                element = element_;

                ngModelCtrl.$render = function() {
                    self.render();
                };
            };

            this.onOptionsChange = function(sourceValues) {

                var locals = {};
                $scope.groups = {};
                $scope.options.length = 0;

                angular.forEach(sourceValues, function(value, index) {
                    locals[parserResult.valueName] = value;

                    var group;
                    var groupName = parserResult.groupByFn($scope, locals) || '';
                    if (!(group = $scope.groups[groupName])) {
                        group = $scope.groups[groupName] = { options: [] };
                    }

                    var option = {
                        label: parserResult.displayFn($scope, locals),
                        value: parserResult.valueFn($scope, locals),
                        id: $scope.uniqueId + '-' + index
                    };

                    if ( $scope.filter.key ) {
                        option[$scope.filter.key] = value[$scope.filter.key];
                    }

                    group.options.push(option);
                });

                angular.forEach($scope.groups, function(group) {
                    $scope.options = $scope.options.concat(group.options);
                });

                $scope.filterOptions();
                this.render();
            };

            $scope.filterOptions = function() {
                if ( !$scope.filter.value ) {
                    $scope.validOptions = $scope.options;
                    angular.forEach($scope.options, function(option) {
                        option.valid = true;
                    });
                } else {
                    var filter = {}, filterKey = $scope.filter.key || 'label';
                    filter [filterKey] = $scope.filter.value;

                    $scope.validOptions = filterFilter( $scope.options, filter );
                    angular.forEach($scope.options, function(option) {
                        option.valid = $scope.validOptions.indexOf(option) > -1;
                    });
                }
            };

            $scope.filterChange = function() {
                $scope.filterOptions();
                if ( $scope.filter.enabled && $scope.validOptions.indexOf($scope.activeOption) === -1 ) {
                    $scope.activeOption = $scope.validOptions[0];
                }
            };

            this.render = function() {
                if ( $scope.multiple ) {
                    renderMultiple();
                } else {
                    renderSingle();
                }
            };

            $scope.isActive = function(option) {
                return option === $scope.activeOption;
            };

            function renderSingle() {
                $scope.selectedOption = null;
                $scope.activeOption = null;

                var found = false;
                angular.forEach($scope.options, function(option) {
                    option.selected = ( !found && angular.equals(ngModelCtrl.$viewValue, option.value) );

                    if ( option.selected ) {
                        $scope.selectedOption = option;
                        $scope.activeOption = option;
                        found = true;
                    }
                });
            }

            function renderMultiple() {
                $scope.selectedOption = [];

                var viewValue = angular.isArray(ngModelCtrl.$viewValue) ? ngModelCtrl.$viewValue : [];
                angular.forEach($scope.options, function(option) {
                    option.selected = viewValue.indexOf(option.value) > -1;

                    if ( option.selected ) {
                        $scope.selectedOption.push(option);
                    }
                });
            }

            this.selectSingle = function(option) {
                ngModelCtrl.$setViewValue(option.value);
                ngModelCtrl.$render();
            };

            this.selectMultiple = function(option) {
                var values = ngModelCtrl.$viewValue || [];

                option.selected = !option.selected;
                if (option.selected) {
                    values.push(option.value);
                } else {
                    values.splice(values.indexOf(option.value), 1);
                }
                ngModelCtrl.$setViewValue(values);
                ngModelCtrl.$render();
                $scope.activeOption = option;
            };

            $scope.select = function(option, e) {
                if ($scope.multiple) {
                    self.selectMultiple(option);
                } else {
                    self.selectSingle(option);
                    $scope.isopen = false;
                }
            };

            $scope.isEmpty = function() {
                return !$scope.selectedOption || ($scope.multiple && $scope.selectedOption.length === 0);
            };

            $scope.prevent = function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
            };

            $scope.$parent.$watchCollection(parserResult.valuesFn, function(sourceValues) {
                self.onOptionsChange(sourceValues);
            });

            $scope.onKeydown = function( evt ) {
                if (!$scope.isopen) {
                    return;
                }

                if (/^(38|40|13|32)$/.test(evt.which)) {
                    evt.preventDefault();
                    evt.stopPropagation();

                    var options = $scope.validOptions,
                        index = options.indexOf($scope.activeOption);

                    if ((evt.which === 13 || evt.which === 32) && index > -1) {
                        $scope.select(options[index]);
                        return;
                    }

                    if (evt.which === 38 && index > 0) {
                        index--;   // up
                    } else if (evt.which === 40 && index < options.length - 1) {
                        index++;   // down
                    }
                    $scope.activeOption = options[index];
                }
            };

            // Respond on ng-disabled changes
            if ($attrs.ngDisabled || $attrs.disabled) {
                $attrs.$observe('disabled', function(value) {
                    if (angular.isDefined(value)) {
                        $scope.isDisabled = value;
                    }
                });
            }

            $scope.onToggle = function() {
                if ( $scope.isopen ) {
                    if ( $scope.filter.enabled ) {
                        $timeout(function() {
                            element.find('input')[0].focus();
                        }, 0, false);
                    }
                } else {
                    if ( $scope.filter.enabled ) {
                        $scope.filter.value = '';
                        $scope.filterOptions();
                    }
                    element.find('button')[0].focus();
                }
            };
        }])

    .directive('dropdownSelect', function () {
        var instance = 0;
        return {
            require: ['dropdownSelect', '?^ngModel'],
            restrict:'EA',
            replace:true,
            scope: {
                type: '@',
                size: '@',
                emptyPlaceholderText: '@',
                optionTemplateUrl: '@',
                filterKey: '@'
            },
            templateUrl:'select.html',
            controller: 'DropdownSelectController',
            link: function(scope, element, attrs, ctrls) {
                var dropdownSelectCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                scope.uniqueId = 'select-' + (instance++) + '-' + Math.floor(Math.random() * 10000);

                if (ngModelCtrl) {
                    dropdownSelectCtrl.init( ngModelCtrl, element );
                }
            }
        };
    })

    .directive('selectOption', ['$http', '$templateCache', '$compile', '$parse', function ($http, $templateCache, $compile, $parse) {
        return {
            require: '^dropdownSelect',
            restrict:'A',
            scope:{
                option:'=selectOption'
            },
            compile: function(elem, attrs) {
                var templateUrlExpr = $parse(attrs.templateUrl);
                return function (scope, element, attrs) {
                    var templateUrl = templateUrlExpr(scope.$parent) || 'option.html';

                    $http.get(templateUrl, {cache: $templateCache}).success(function(tplContent){
                        element.append($compile(tplContent.trim())(scope));
                    });
                };
            }
        };
    }])

    .directive('placeholderEmpty', ['dropdownSelectConfig', function (dropdownSelectConfig) {
        return {
            restrict:'EA',
            scope:{
                emptyPlaceholderText: '@'
            },
            replace: true,
            templateUrl: 'placeholder-empty.html',
            link: function (scope, element, attrs) {
                scope.getEmptyText = function() {
                    return scope.emptyPlaceholderText || dropdownSelectConfig.emptyPlaceholderText;
                };
            }
        };
    }]);
