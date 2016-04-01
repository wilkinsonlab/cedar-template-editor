/*jslint node: true */
/*global define */
'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.core.run', [])
      .run(cedarTemplateEditorCoreRun);

  cedarTemplateEditorCoreRun.$inject = ['$rootScope', '$window', '$sce', '$translate', 'DataTemplateService',
                                        'DataManipulationService', 'FieldTypeService', 'UrlService', 'UIUtilService',
                                        'UserService', 'UserDataService', 'RichTextConfigService', 'CONST',
                                        'controlTermDataService', 'provisionalClassService', 'Cedar',
                                        'UISettingsService', 'ValueRecommenderService', 'DataUtilService', 'TrackingService'];

  function cedarTemplateEditorCoreRun($rootScope, $window, $sce, $translate, DataTemplateService,
                                      DataManipulationService, FieldTypeService, UrlService, UIUtilService,
                                      UserService, UserDataService, RichTextConfigService, CONST,
                                      controlTermDataService, provisionalClassService, Cedar,
                                      UISettingsService, ValueRecommenderService, DataUtilService, TrackingService) {

    $rootScope.isArray = angular.isArray;

    $rootScope.applicationMode = CONST.applicationMode.DEFAULT;
    $rootScope.applicationRole = 'instantiator';
    $rootScope.pageId = null;

    $rootScope.sortableOptions = {
      handle: ".sortable-handler"
    };

    // Global utility functions

    // Simple function to check if an object is empty
    $rootScope.isEmpty = function (obj) {
      return !obj || Object.keys(obj).length === 0;
    };

    // Capitalize first letter
    /*
     egyedia - this seems to be unused
    $rootScope.capitalizeFirst = function (string) {
      string = string.toLowerCase();
      return string.substring(0, 1).toUpperCase() + string.substring(1);
    };
    */

    // Sorting function that moves boolean values with true to the front of the sort
    /*
     egyedia - this seems to be unused
     $rootScope.sortBoolean = function (array, bool) {
     return array.sort(function (a, b) {
     var x = a[bool],
     y = b[bool];
     return ((x == y) ? -1 : ((x === true) ? -1 : 1));
     });
     };
     */

    $rootScope.propertiesOf = function (fieldOrElement) {
      return DataManipulationService.getFieldProperties(fieldOrElement);
    };

    $rootScope.console = function (txt, label) {
      console.log(label + ' ' + JSON.stringify(txt, null, 2));
    };

    $rootScope.isRuntime = function () {
      return $rootScope.pageId == 'RUNTIME';
    };

    $rootScope.elementIsMultiInstance = DataManipulationService.elementIsMultiInstance;

    /*
     egyedia - this seems to be unused
     $rootScope.isField = function (value) {
      return value && value.properties && value.properties._ui && value.properties._ui.inputType;
    };
    */

    $rootScope.isElement = function (value) {
      return value && value._ui;
    };

    // Used in cedar-template-element.directive.js, form.directive
    $rootScope.findChildren = function (iterator, parentModel, parentKey, level) {
      var ctx, min, type, i;
      angular.forEach(iterator, function (value, name) {
        // Add @context information to instance
        if (name == '@context') {
          ctx = DataManipulationService.generateInstanceContext(value);
        }
      });

      angular.forEach(iterator, function (value, name) {
        // Add @context information to instance
        if (name == '@context') {
          parentModel['@context'] = DataManipulationService.generateInstanceContext(value);
        }
        // Add @type information to instance
        else if (name == '@type') {
          type = DataManipulationService.generateInstanceType(value);
          if (type) {
            parentModel['@type'] = type;
          }
        }

        min = value.minItems || 0;

        if (!DataUtilService.isSpecialKey(name)) {
          // We can tell we've reached an element level by its 'order' property
          if (value._ui && value._ui.order) {

            if (DataManipulationService.isCardinalElement(value)) {
              parentModel[name] = [];
              for (i = 0; i < min; i++) {
                parentModel[name].push({});
              }
            } else {
              parentModel[name] = {};
            }
          } else {

            // Assign empty field instance model to $scope.model only if it does not exist
            if (!parentModel[name]) {
              if (!DataManipulationService.isCardinalElement(value)) {
                parentModel[name] = {};
              } else {
                parentModel[name] = [];
                for (i = 0; i < min; i++) {
                  var obj = {};
                  parentModel[name].push(obj);
                }
              }
            }

            var p = $rootScope.propertiesOf(value);

            // Add @type information to instance at the field level
            if (p && !angular.isUndefined(p['@type'])) {
              type = DataManipulationService.generateInstanceType(p['@type']);

              if (type) {
                if (angular.isArray(parentModel[name])) {
                  for (i = 0; i < min; i++) {
                    parentModel[name][i]["@type"] = type || "";
                  }
                } else {
                  parentModel[name]["@type"] = type || "";
                }
              }
            }
          }
        }
      });
    };

    /*
     egyedia - this seems to be unused
     $rootScope.assignOrder = function (fieldOrElement, parentElement) {
     var order = 1;
     angular.forEach(parentElement, function (value, key) {
     if ($rootScope.isElement(value) || $rootScope.isField(value)) {
     order += 1;
     }
     });

     fieldOrElement.properties._ui.order = order;
     };
     */

    $rootScope.scrollToAnchor = UIUtilService.scrollToAnchor;

    var minCardinalities = DataManipulationService.generateCardinalities(0, 8);
    var maxCardinalities = DataManipulationService.generateCardinalities(1, 8);
    maxCardinalities.push({value: 0, label: "N"});

    $rootScope.minCardinalities = minCardinalities;
    $rootScope.maxCardinalities = maxCardinalities;

    // BioPortal term selection integration code.
    // TODO: separate the calls, create a service for these
    $rootScope.isKeyVisible = function (keyCode) {
      if (keyCode > 45 && keyCode < 112 && [91, 92, 93].indexOf(keyCode) == -1 ||
          keyCode >= 186 && keyCode <= 222 ||
          [8, 32, 173].indexOf(keyCode) >= 0) {
        return true;
      } else {
        return false;
      }
    };

    // Used in field.directive.js and textfield.html
    $rootScope.hasValueConstraint = function (vcst) {
      var result = vcst && (vcst.ontologies && vcst.ontologies.length > 0 ||
          vcst.valueSets && vcst.valueSets.length > 0 ||
          vcst.classes && vcst.classes.length > 0 ||
          vcst.branches && vcst.branches.length > 0);

      return result;
    };

    $rootScope.autocompleteResultsCache = {};

    // Used here
    $rootScope.sortAutocompleteResults = function (field_id) {
      $rootScope.autocompleteResultsCache[field_id].results.sort(function (a, b) {
        var labelA = a.label.toLowerCase();
        var labelB = b.label.toLowerCase();
        if (labelA < labelB)
          return -1;
        if (labelA > labelB)
          return 1;
        return 0;
      });
    };

    // Used here
    $rootScope.removeAutocompleteResultsForSource = function (field_id, source_uri) {
      // remove results for this source
      for (var i = $rootScope.autocompleteResultsCache[field_id].results.length - 1; i >= 0; i--) {
        if ($rootScope.autocompleteResultsCache[field_id].results[i].sourceUri === source_uri) {
          $rootScope.autocompleteResultsCache[field_id].results.splice(i, 1);
        }
      }
    };

    // Used here
    $rootScope.processAutocompleteClassResults = function (field_id, field_type, source_uri, response) {
      var i, j, found;
      // we do a complicated method to find the changed results to reduce flicker :-/
      for (j = $rootScope.autocompleteResultsCache[field_id].results.length - 1; j >= 0; j--) {
        if ($rootScope.autocompleteResultsCache[field_id].results[j].sourceUri != source_uri) {
          // we only care about the ones from this source
          continue;
        }
        found = false;
        for (i = 0; i < response.collection.length; i++) {
          if (response.collection[i]['@id'] == $rootScope.autocompleteResultsCache[field_id].results[j]['@id']) {
            // this option still in the result set -- mark it
            response.collection[i].found = true;
            found = true;
          }
        }
        if (!found) {
          // need to remove this option
          $rootScope.autocompleteResultsCache[field_id].results.splice(j, 1);
        }
      }
      for (i = 0; i < response.collection.length; i++) {
        if (!response.collection[i].found) {
          $rootScope.autocompleteResultsCache[field_id].results.push(
              {
                '@id'      : response.collection[i]['@id'],
                'label'    : response.collection[i].prefLabel,
                'type'     : field_type,
                'sourceUri': source_uri
              }
          );
        }
      }
      if ($rootScope.autocompleteResultsCache[field_id].results.length === 0) {
        $rootScope.autocompleteResultsCache[field_id].results.push({
          'label': $translate.instant('GENERIC.NoResults')
        });
      } else {
        for (i = 0; i < $rootScope.autocompleteResultsCache[field_id].results.length; i++) {
          if ($rootScope.autocompleteResultsCache[field_id].results[i].label == $translate.instant('GENERIC.NoResults')) {
            $rootScope.autocompleteResultsCache[field_id].results.splice(i, 1);
            break;
          }
        }
        $rootScope.sortAutocompleteResults(field_id);
      }
    };

    // Used in textfield.html
    $rootScope.updateFieldAutocomplete = function (field, term) {
      if (term === '') {
        term = '*';
      }
      var results = [];
      var properties = $rootScope.propertiesOf(field);
      var vcst = properties._valueConstraints;
      var field_id = field['@id'];

      if (angular.isUndefined($rootScope.autocompleteResultsCache[field_id])) {
        $rootScope.autocompleteResultsCache[field_id] = {
          'results': []
        };
      }

      if (vcst.classes.length > 0) {
        $rootScope.removeAutocompleteResultsForSource(field_id, 'template');
        angular.forEach(vcst.classes, function (klass) {
          if (term == '*') {
            $rootScope.autocompleteResultsCache[field_id].results.push(
                {
                  '@id'      : klass.uri,
                  'label'    : klass.label,
                  'type'     : 'Ontology Class',
                  'sourceUri': 'template'
                }
            );
          } else {
            if (klass && klass.label && klass.label.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
              $rootScope.autocompleteResultsCache[field_id].results.push(
                  {
                    '@id'      : klass.uri,
                    'label'    : klass.label,
                    'type'     : 'Ontology Class',
                    'sourceUri': 'template'
                  }
              );
            }
          }
        });
        if (term !== '*') {
          if ($rootScope.autocompleteResultsCache[field_id].results.length === 0) {
            $rootScope.autocompleteResultsCache[field_id].results.push({
              'label'    : $translate.instant('GENERIC.NoResults'),
              'sourceUri': 'template'
            });
          }
        }
      }

      if (vcst.valueSets.length > 0) {
        angular.forEach(vcst.valueSets, function (valueSet) {
          if (term == '*') {
            $rootScope.removeAutocompleteResultsForSource(field_id, valueSet.uri);
          }
          controlTermDataService.autocompleteValueSetClasses(term, valueSet.uri).then(function (childResponse) {
            $rootScope.processAutocompleteClassResults(field_id, 'Value Set Class', valueSet.uri, childResponse);
          });
        });
      }

      if (vcst.ontologies.length > 0) {
        angular.forEach(vcst.ontologies, function (ontology) {
          if (term == '*') {
            $rootScope.removeAutocompleteResultsForSource(field_id, ontology.uri);
          }
          controlTermDataService.autocompleteOntology(term, ontology.acronym).then(function (childResponse) {
            $rootScope.processAutocompleteClassResults(field_id, 'Ontology Class', ontology.uri, childResponse);
          });
        });
      }

      if (vcst.branches.length > 0) {
        angular.forEach(vcst.branches, function (branch) {
          if (term == '*') {
            $rootScope.removeAutocompleteResultsForSource(field_id, branch.uri);
          }
          controlTermDataService.autocompleteOntologySubtree(term, branch.acronym, branch.uri, branch.maxDepth).then(
              function (childResponse) {
                $rootScope.processAutocompleteClassResults(field_id, 'Ontology Class', branch.uri, childResponse);
              }
          );
        });
      }
    };

    // Used here by isValueConformedToConstraint
    $rootScope.excludedValueConstraint = function (id, vcst) {
      if ($rootScope.excludedValues && $rootScope.excludedValues[id]) {
        return $rootScope.excludedValues[id];
      }

      var results = [];

      if (vcst.classes.length > 0) {
        angular.forEach(vcst.classes, function (klass) {
          jQuery.merge(results, klass.exclusions || []);
        });
      }

      if (vcst.valueSets.length > 0) {
        angular.forEach(vcst.valueSets, function (klass) {
          jQuery.merge(results, klass.exclusions || []);
        });
      }

      if (vcst.ontologies.length > 0) {
        angular.forEach(vcst.ontologies, function (klass) {
          jQuery.merge(results, klass.exclusions || []);
        });
      }

      if (vcst.branches.length > 0) {
        angular.forEach(vcst.branches, function (klass) {
          jQuery.merge(results, klass.exclusions || []);
        });
      }

      $rootScope.excludedValues = $rootScope.excludedValues || {};
      $rootScope.excludedValues[id] = results;

      return results;
    };

    // Used in field.directive
    $rootScope.isValueConformedToConstraint = function (value, id, vcst) {
      var predefinedValues = $rootScope.autocompleteResultsCache[id].results;
      var excludedValues = $rootScope.excludedValueConstraint(id, vcst);
      var isValid = false;
      var jsonString = JSON.stringify(value);

      angular.forEach(predefinedValues, function (val) {
        if (!isValid) {
          // IMPORTANT: this compare only valid if the 2 objects are simple
          // and all properties are in the same order.
          isValid = JSON.stringify(val) == jsonString;
        }
      });

      isValid = excludedValues.indexOf(value.uri) == -1;

      return isValid;
    };

    $rootScope.isOntology = function (obj) {
      return obj && obj["@type"] && obj["@type"].indexOf("Ontology") > 0;
    };

    // Used in cedar-control-term.directive
    $rootScope.lengthOfValueConstraint = function (valueConstraint) {
      return (valueConstraint.classes || []).length +
          (valueConstraint.valueSets || []).length +
          (valueConstraint.ontologies || []).length +
          (valueConstraint.branches || []).length;
    };

    // Used in richtext.html
    $rootScope.getUnescapedContent = function (field) {
      return $sce.trustAsHtml($rootScope.propertiesOf(field)._content);
    };


    Cedar.init();
    $rootScope.cedar = Cedar;
    DataTemplateService.init();
    FieldTypeService.init();
    UrlService.init();
    provisionalClassService.init();
    controlTermDataService.init();
    DataManipulationService.init();
    UISettingsService.init();
    TrackingService.init();

    UserService.injectUserHandler($window.bootstrapUserHandler);
    UserService.init(function () {
      UserDataService.readUserDetails();
    });

    $rootScope.vrs = ValueRecommenderService;

    $rootScope.editorOptions = RichTextConfigService.getConfig("default");

    // google analytics tracking
    ga('create', 'UA-73983324-1', 'auto');
    $rootScope.$on('$stateChangeSuccess', function (event) {
      $window.ga('send', 'pageview', $location.path());
      console.log('ga pageview event '+ $location.path());
    });



  };

});