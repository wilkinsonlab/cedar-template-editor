'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.templateElement.cedarRuntimeElement', [])
      .directive('cedarRuntimeElement', cedarRuntimeElement);

  cedarRuntimeElement.$inject = ['$rootScope', '$timeout', '$window', 'DataManipulationService', 'DataUtilService',
                                 'SpreadsheetService'];

  function cedarRuntimeElement($rootScope, $timeout, $window, DataManipulationService, DataUtilService,
                               SpreadsheetService) {

    var directive = {
      restrict   : 'EA',
      scope      : {
        key          : '=',
        element      : '=',
        delete       : '&',
        model        : '=',
        isRootElement: "=",
        depth        : '=',
        path         : '='
      },
      templateUrl: 'scripts/template-element/cedar-runtime-element.directive.html',
      link       : linker
    };

    return directive;

    function linker(scope, el, attrs) {

      scope.elementId = DataManipulationService.idOf(scope.element) || DataManipulationService.generateGUID();
      scope.uuid = DataManipulationService.generateTempGUID();
      scope.expanded = [];
      //scope.multipleStates = ['expanded', 'paged','spreadsheet'];
      scope.multipleStates = ['expanded', 'paged'];
      scope.multipleState = 'paged';
      scope.index = 0;
      scope.pageMin = 0;
      scope.pageMax = scope.model.length;
      scope.pageRange = 6;
      scope.nestingMargin = 15;


      var resetElement = function (el, settings) {
        angular.forEach(el, function (model, key) {
          if (settings[key] && settings[key].minItems && angular.isArray(model)) {
            model.splice(settings[key].minItems, model.length);
          }
          if (!DataUtilService.isSpecialKey(key)) {
            if (key == '@value') {
              if (angular.isArray(model)) {
                if ($rootScope.schemaOf(settings)._ui.inputType == "list") {
                  model.splice(0, model.length);
                } else {
                  for (var i = 0; i < model.length; i++) {
                    if (typeof(model[i]['@value']) == "string") {
                      model[i]['@value'] = "";
                    } else if (angular.isArray(model[i]['@value'])) {
                      model[i]['@value'] = [];
                    } else if (angular.isObject(model[i]['@value'])) {
                      model[i]['@value'] = {};
                    }
                  }
                }
              } else if (typeof(model) == "string") {
                el[key] = "";
              } else if (angular.isArray(model)) {
                el[key] = [];
              } else if (angular.isObject(model)) {
                el[key] = {};
              }
            } else {
              if (settings[key]) {
                resetElement(model, settings[key]);
              } else {
                // This case el is an array
                angular.forEach(model, function (v, k) {
                  if (k == '@value') {
                    if (angular.isArray(v)) {
                      if ($rootScope.schemaOf(settings)._ui.inputType == "list") {
                        v.splice(0, v.length);
                      } else {
                        for (var i = 0; i < v.length; i++) {

                          if (typeof(v[i]['@value']) == "string") {
                            v[i]['@value'] = "";
                          } else if (angular.isArray(v[i]['@value'])) {
                            v[i]['@value'] = [];
                          } else if (angular.isObject(v[i]['@value'])) {
                            v[i]['@value'] = {};
                          }

                        }
                      }
                    } else if (typeof(v) == "string") {
                      model[k] = "";
                    } else if (angular.isArray(v)) {
                      model[k] = [];
                    } else if (angular.isObject(v)) {
                      model[k] = {};
                    }
                  } else if (k !== '@type') {
                    if (settings[k]) {
                      resetElement(v, settings[k]);
                    }
                  }
                });
              }
            }
          }
        });
      };


      scope.isInactive = function (index) {
        return DataManipulationService.isInactive(DataManipulationService.getLocator(scope.element, index, scope.path));
      };

      scope.isNested = function () {
        return DataManipulationService.isNested(scope.element);
      };

      scope.getNestingDepth = function () {
        return scope.depth;
      };

      scope.getNestingMargin = function () {
        return 'margin-left: ' + scope.nestingMargin + 'px';
      };

      scope.getNesting = function () {

        var path = scope.path || '';
        var arr = path.split('-');
        var result = [];
        for (var i = 0; i < arr.length; i++) {
          result.push(i);
        }
        return result;
      };

      scope.getNestingCount = function () {

        var path = scope.path || '';
        var arr = path.split('-');
        return arr.length;
      };

      scope.getNestingStyle = function (index) {
        return 'left:' + (-scope.nestingMargin * (index)) + 'px';
      };


      scope.getParentTitle = function () {
        return 'parent';
      };

      scope.getTitle = function () {
        return DataManipulationService.getFieldSchema(scope.element)._ui.title;
      };


      scope.addElement = function () {

        if ((!scope.element.maxItems || scope.model.length < scope.element.maxItems)) {
          var seed = {};

          if (scope.model.length > 0) {

            seed = angular.copy(scope.model[0]);
            resetElement(seed, scope.element);
            scope.model.push(seed);


          } else {

            scope.model.push(seed);
            if (angular.isArray(scope.model)) {
              angular.forEach(scope.model, function (m) {
                $rootScope.findChildren($rootScope.propertiesOf(scope.element), m);
              });
            } else {
              $rootScope.findChildren($rootScope.propertiesOf(scope.element), scope.model);
            }
            resetElement(seed, scope.element);
          }
          // activate the new instance
          var index = scope.model.length - 1;
          scope.setActive(index, true);
          scope.toggleExpanded(index);

          // select the first field in the element


        }
      };

      scope.getId = function (index) {
        return DataManipulationService.getId(scope.element);
      };

      scope.getLocator = function (index) {
        return DataManipulationService.getLocator(scope.element, index, scope.path);
      };

      scope.removeElement = function (index) {
        if (scope.model.length > scope.element.minItems) {
          scope.model.splice(index, 1);
        }
      };

      scope.switchToSpreadsheet = function () {
        SpreadsheetService.switchToSpreadsheetElement(scope, scope.element);
      };

      scope.toggleExpanded = function (index) {
        scope.expanded[index] = !scope.expanded[index];
        if (scope.expanded[index]) {
          scope.setActive(index, true);
        }
      };

      scope.isExpanded = function (index) {
        return scope.expanded[index];
      };

      scope.setExpanded = function (index, value) {
        return scope.expanded[index] = value;
      };

      scope.unExpand = function (index) {
        scope.expanded[index] = false;
        scope.setActive(index, false);
      };

      scope.isExpandable = function () {
        return true;
      };


      scope.expandAll = function () {

        // expand all the items in the valueArray
        if (scope.valueArray.length == 0) {
          scope.addMoreInput();
        } else {
          for (var i = 0; i < scope.valueArray.length; i++) {
            scope.expanded[i] = true;
            scope.setActive(0, true);
          }
        }

        // let these draw, then send out expandAll to the newly drawn elements
        $timeout(function () {
          var schema = $rootScope.schemaOf(scope.element);
          var selectedKey;
          var props = $rootScope.propertiesOf(scope.element);
          angular.forEach(props, function (value, key) {

            var valueSchema = $rootScope.schemaOf(value);
            var valueId = valueSchema["@id"];

            if ($rootScope.isElement(valueSchema)) {
              scope.$broadcast("expandAll", [valueId]);
            }
          });

        }, 0);
      };

      scope.$on('expandAll', function (event, args) {
        var id = args[0];

        // only look at first level elements
        if (id === scope.getId()) {

          scope.expandAll();
        }
      });


      scope.removeChild = function (fieldOrElement) {
        // fieldOrElement must contain the schema level
        fieldOrElement = $rootScope.schemaOf(fieldOrElement);

        var selectedKey;
        var props = $rootScope.propertiesOf(scope.element);
        angular.forEach(props, function (value, key) {
          if (value["@id"] == fieldOrElement["@id"]) {
            selectedKey = key;
          }
        });

        if (selectedKey) {
          delete props[selectedKey];

          var idx = $rootScope.schemaOf(scope.element)._ui.order.indexOf(selectedKey);
          $rootScope.schemaOf(scope.element)._ui.order.splice(idx, 1);

          if ($rootScope.isElement(fieldOrElement)) {
            scope.$emit("invalidElementState",
                ["remove", $rootScope.schemaOf(fieldOrElement)._ui.title, fieldOrElement["@id"]]);
          } else {
            scope.$emit("invalidFieldState",
                ["remove", $rootScope.schemaOf(fieldOrElement)._ui.title, fieldOrElement["@id"]]);
          }
        }
      };

      scope.isCardinal = function () {
        return DataManipulationService.isCardinalElement(scope.element);
      };

      scope.canDeselect = function (fieldOrElement) {
        return DataManipulationService.canDeselect(fieldOrElement);
      };

      scope.canSelect = function (select) {
        if (select)
          DataManipulationService.canSelect(scope.element);
      };

      scope.renameChildKey = function (child, newKey) {
        if (!child) {
          return;
        }

        var childId = DataManipulationService.idOf(child);

        if (!childId || /^tmp\-/.test(childId)) {
          var p = $rootScope.propertiesOf(scope.element);
          if (p[newKey] && p[newKey] == child) {
            return;
          }

          newKey = DataManipulationService.getAcceptableKey(p, newKey);
          angular.forEach(p, function (value, key) {
            if (!value) {
              return;
            }

            var idOfValue = DataManipulationService.idOf(value);
            if (idOfValue && idOfValue == childId) {
              DataManipulationService.renameKeyOfObject(p, key, newKey);

              if (p["@context"] && p["@context"].properties) {
                DataManipulationService.renameKeyOfObject(p["@context"].properties, key, newKey);

                if (p["@context"].properties[newKey] && p["@context"].properties[newKey].enum) {
                  p["@context"].properties[newKey].enum[0] = DataManipulationService.getEnumOf(newKey);
                }
              }

              if (p["@context"].required) {
                var idx = p["@context"].required.indexOf(key);
                p["@context"].required[idx] = newKey;
              }

              var idx = $rootScope.schemaOf(scope.element)._ui.order.indexOf(key);
              $rootScope.schemaOf(scope.element)._ui.order[idx] = newKey;
            }
          });
        }
      };

      scope.isMultiple = function () {
        return $rootScope.isArray(scope.model);
      };

      // is this field actively being edited?
      scope.isActive = function (index) {
        return DataManipulationService.isActive(DataManipulationService.getLocator(scope.element));
      };

      scope.cardinalityString = function () {
        return DataManipulationService.cardinalityString(scope.element);
      };


      // allows us to look a the model as an array
      scope.valueArray;
      scope.setValueArray = function () {

        scope.valueArray = [];
        if (scope.model instanceof Array) {

          scope.valueArray = scope.model;

        } else {

          if (!scope.model) {
            scope.model = {};
          }

          scope.valueArray = [];
          scope.valueArray.push(scope.model);

        }
      };
      scope.setValueArray();


      // watch for this field's next sibling
      scope.$on('nextSibling', function (event, args) {
        var id = args[0];
        var index = args[1];
        var path = args[2];
        var value = args[3];

        // only look at first level elements
        if (id === scope.getId() && path === '0') {

          var parent = $rootScope.rootElement;
          var next = DataManipulationService.nextSibling(scope.element, parent);


          if (next) {
            $rootScope.$broadcast("setActive", [DataManipulationService.getId(next), 0, '0', true]);
          } else {
            DataManipulationService.setActive(id, false);
          }
        }
      });

      // watch for this field's active state
      scope.$on('setActive', function (event, args) {
        var id = args[0];
        var index = args[1];
        var path = args[2];
        var value = args[3];

        if (id === scope.getId() && path == scope.path) {

          scope.expanded[index] = true;
          $timeout(function () {

            var props = $rootScope.schemaOf(scope.element).properties;
            var order = $rootScope.schemaOf(scope.element)._ui.order;
            var nextKey = order[0];
            var next = props[nextKey];
            $rootScope.$broadcast("setActive",
                [DataManipulationService.getId(next), 0, scope.path + '-' + index, true]);

          }, 0);
        }
      });


      scope.pageMinMax = function () {
        scope.pageMax = Math.min(scope.valueArray.length, scope.index + scope.pageRange);
        scope.pageMin = Math.max(0, scope.pageMax - scope.pageRange);
      };
      scope.pageMinMax();


      scope.addMoreInput = function () {
        scope.addElement();
        scope.pageMinMax();
      };

      scope.setActive = function (index, value) {
        DataManipulationService.setActive(scope.element, index, scope.path, value);
        //if (value) {
        scope.index = index;
        scope.pageMinMax();
        //}
      };

      scope.selectPage = function (i) {
        scope.setActive(i, true);
      };

      scope.showMultiple = function (state) {
        return (scope.multipleState === state);
      };

      scope.toggleMultiple = function () {
        var i = scope.multipleStates.indexOf(scope.multipleState);
        i = (i + 1) % scope.multipleStates.length;
        scope.multipleState = scope.multipleStates[i];

        if (scope.multipleState === 'spreadsheet') {

          $timeout(function () {
            scope.switchToSpreadsheet();
            scope.$apply();
          }, 0);

        }

        //$timeout(function () {
        //  scope.$apply();
        //}, 100);
        return scope.multipleState;
      };


    }
  };

})
;
