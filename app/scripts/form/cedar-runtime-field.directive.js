'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.form.cedarRuntimeField', [])
      .directive('cedarRuntimeField', cedarRuntimeField);


  cedarRuntimeField.$inject = ["$rootScope", "$sce", "$document", "$translate", "$filter", "$location",
                               "$window", '$timeout',
                               "SpreadsheetService",
                               "DataManipulationService", "controlledTermDataService",
                               "StringUtilsService", 'UISettingsService'];

  function cedarRuntimeField($rootScope, $sce, $document, $translate, $filter, $location, $window,
                             $timeout,
                             SpreadsheetService,
                             DataManipulationService,
                             controlledTermDataService, StringUtilsService, UISettingsService) {


    var linker = function ($scope, $element, attrs) {

      $scope.directory = 'runtime';
      $scope.midnight = $translate.instant('GENERIC.midnight');
      $scope.uuid = DataManipulationService.generateTempGUID();
      $scope.data = {
        model: null
      };
      //$scope.multipleStates = ['expanded', 'paged','spreadsheet'];
      $scope.multipleStates = ['expanded', 'paged'];
      $scope.multipleState = 'paged';
      $scope.index = 0;
      $scope.pageMin = 0;
      $scope.pageMax = $scope.model.length;
      $scope.pageRange = 6;


      // get the field title
      $scope.getTitle = function (field) {
        return DataManipulationService.getTitle(field);
      };

      // get the field description
      $scope.getDescription = function () {
        return DataManipulationService.getDescription($scope.field);
      };

      // get the field id?
      $scope.getId = function () {
        return DataManipulationService.getId($scope.field);
      };

      // what type?  static, field or element
      $scope.getType = function (field) {
        return DataManipulationService.getId($scope.field);
      };

      // what is the content
      $scope.getContent = function (field) {
        return DataManipulationService.getContent(field);
      };

      // does this field have a value constraint?
      $scope.hasValueConstraint = function () {
        return DataManipulationService.hasValueConstraint($scope.field);
      };

      // get the value constraint literal values
      $scope.getLiterals = function () {
        return DataManipulationService.getLiterals($scope.field);
      };

      // Retrieve appropriate field template file
      $scope.getFieldUrl = function () {
        return 'scripts/form/runtime-field' + '/' + DataManipulationService.getInputType($scope.field) + '.html';
      };

      // what kind of field is this?
      $scope.getInputType = function () {
        return DataManipulationService.getInputType($scope.field);
      };

      $scope.isMultipleChoice = function () {
        return DataManipulationService.isMultipleChoice($scope.field);
      };

      // is the field multiple cardinality?
      $scope.isMultipleCardinality = function () {
        return DataManipulationService.isMultipleCardinality($scope.field);
      };

      // is this field required?
      $scope.isRequired = function () {
        return DataManipulationService.isRequired($scope.field);
      };

      // is this a checkbox, radio or list question?
      $scope.isMultiAnswer = function () {
        return DataManipulationService.isMultiAnswer($scope.field);
      };

      // what is the dom id for this field?
      $scope.getLocator = function (index) {
        return DataManipulationService.getLocator($scope.field, index, $scope.path);
      };

      // is this field actively being edited?
      $scope.isActive = function (index) {
        return DataManipulationService.isActive(DataManipulationService.getLocator($scope.field, index, $scope.path));
      };

      $scope.isInactive = function (index) {
        return DataManipulationService.isInactive(DataManipulationService.getLocator($scope.field, index, $scope.path));
      };

      // is this a youTube field?
      $scope.isYouTube = function (field) {
        return DataManipulationService.isYouTube(field);
      };

      // is this richText?
      $scope.isRichText = function (field) {
        return DataManipulationService.isRichText(field);
      };

      // is this a static image?
      $scope.isImage = function (field) {
        return DataManipulationService.isImage(field);
      };

      // is the previous field static?
      $scope.isPreviousStatic = function () {
        return $scope.previous && DataManipulationService.isStaticField($scope.previous);
      };

      // is the previous field static?
      $scope.isDateRange = function () {
        return DataManipulationService.isDateRange($scope.field);
      };


      // set the @type field in the model
      $scope.setValueType = function () {
        var properties = $rootScope.propertiesOf($scope.field);
        var typeEnum = properties['@type'].oneOf[0].enum;
        if (angular.isDefined(typeEnum) && angular.isArray(typeEnum)) {
          if (typeEnum.length == 1) {
            $scope.model['@type'] = properties['@type'].oneOf[0].enum[0];
          } else {
            $scope.model['@type'] = properties['@type'].oneOf[0].enum;
          }
        }
      };

      // add more instances to a multiple cardinality field if possible
      $scope.addMoreInput = function () {
        console.log('addMoreInput');
        var maxItems = DataManipulationService.getMaxItems($scope.field);
        if ((!maxItems || $scope.model.length < maxItems)) {

          // add another instance in the model
          $scope.model.push({'@value': null});


          // activate the new instance
          $timeout($scope.setActive($scope.model.length - 1, true), 100);
        }
      };

      $scope.pageMinMax = function () {
        $scope.pageMax = Math.min($scope.valueArray.length, $scope.index + $scope.pageRange);
        $scope.pageMin = Math.max(0, $scope.pageMax - $scope.pageRange);
      };

      $scope.selectPage = function (i) {
        $scope.onSubmit($scope.index, i);
      };

      // remove the value of field at index
      $scope.removeInput = function (index) {
        var minItems = DataManipulationService.getMinItems($scope.field) || 0;
        if ($scope.model.length > minItems) {
          $scope.model.splice(index, 1);
        }
      };

      $scope.isExpandable = function () {
        return false;
      };

      $scope.expandAll = function () {
      };

      // show this field as a spreadsheet
      $scope.switchToSpreadsheet = function () {
        console.log('switchToSpreadhseet');

        SpreadsheetService.switchToSpreadsheetField($scope, $element);
      };

      // look for errors
      $scope.checkFieldConditions = function (field) {
        field = $rootScope.schemaOf(field);

        var unmetConditions = [],
            extraConditionInputs = ['checkbox', 'radio', 'list'];

        // Field title is required, if it's empty create error message
        if (!field._ui.title) {
          unmetConditions.push('"Enter Field Title" input cannot be left empty.');
        }

        // If field is within multiple choice field types
        if (extraConditionInputs.indexOf($scope.getInputType()) !== -1) {
          var optionMessage = '"Enter Option" input cannot be left empty.';
          angular.forEach(field._valueConstraints.literals, function (value, index) {
            // If any 'option' title text is left empty, create error message
            if (!value.label.length && unmetConditions.indexOf(optionMessage) == -1) {
              unmetConditions.push(optionMessage);
            }
          });
        }
        // If field type is 'radio' or 'pick from a list' there must be more than one option created
        if (($scope.getInputType() == 'radio' || $scope.getInputType() == 'list') && field._valueConstraints.literals && (field._valueConstraints.literals.length <= 1)) {
          unmetConditions.push('Multiple Choice fields must have at least two possible options');
        }
        // Return array of error messages
        return unmetConditions;
      };

      $scope.getYouTubeEmbedFrame = function (field) {

        var width = 560;
        var height = 315;
        var content = $rootScope.propertiesOf(field)._content.replace(/<(?:.|\n)*?>/gm, '');

        if ($rootScope.propertiesOf(field)._size && $rootScope.propertiesOf(field)._size.width && Number.isInteger($rootScope.propertiesOf(field)._size.width)) {
          width = $rootScope.propertiesOf(field)._size.width;
        }
        if ($rootScope.propertiesOf(field)._size && $rootScope.propertiesOf(field)._size.height && Number.isInteger($rootScope.propertiesOf(field)._size.height)) {
          height = $rootScope.propertiesOf(field)._size.height;
        }

        // if I say trust as html, then better make sure it is safe first
        return $sce.trustAsHtml('<iframe width="' + width + '" height="' + height + '" src="https://www.youtube.com/embed/' + content + '" frameborder="0" allowfullscreen></iframe>');

      };

      // string together the values for a checkbox, list or radio item
      $scope.getValueString = function (valueElement) {
        var result = ' ';
        for (var i = 0; i < valueElement.length; i++) {
          if (valueElement[i]['@value']) {
            result += valueElement[i]['@value'];
            if (i < valueElement.length - 1) {
              result += ', ';
            }
          }
        }
        return result.trim().replace(/,\s*$/, "");
      };

      // watch for a request to set this field active
      $scope.$on('setActive', function (event, args) {
        var id = args[0];
        var index = args[1];
        var path = args[2];
        var value = args[3];

        if (id === $scope.getId() && path == $scope.path) {
          $scope.setActive(index, value);
        }
      });

      $scope.setInactive = function(index) {
        $scope.setActive(index, false);
      };

      // set this field and index active
      $scope.setActive = function (index, value) {
        console.log('setActive' + index + value + $scope.index);

        // off or on
        var active = (typeof value === "undefined") ? true : value;
        var locator = $scope.getLocator(index);
        var current = DataManipulationService.isActive(locator);

        console.log(locator + ' ' + active + ' ' + current);

        if (active !== current) {


          // if zero cardinality,  add a new item
          if ($scope.isMultipleCardinality() && $scope.model.length <= 0) {
            $scope.addMoreInput();
          }

          // set it active or inactive
          DataManipulationService.setActive($scope.field, index, $scope.path, active);

          if (active) {

            $scope.index = index;
            $scope.pageMinMax();


            // scroll it into the center of the screen and listen for shift-enter
            $scope.scrollToLocator(locator, ' .select');
            $document.unbind('keypress');
            $document.bind('keypress', function (e) {
              $scope.isSubmit(e);
            });

          } else {
            // set blur and force a redraw
            jQuery("#" + locator).blur();

            //setTimeout(function () {
            //  $scope.$apply();
            //}, 0);

          }
        }
      };

      // scroll within the template to the field with the locator, focus and select the tag
      $scope.scrollToLocator = function (locator, tag) {



        var target = angular.element('#' + locator);

        if (target && target.offset()) {


          $scope.setHeight = function () {

            // apply any changes first before examining dom elements
            $scope.$apply();

            var window = angular.element($window);
            var windowHeight = $(window).height();
            var target = jQuery("#" + locator);
            if (target) {

              var targetTop = target.offset().top;
              var targetHeight = target.outerHeight(true);
              var scrollTop = jQuery('.template-container').scrollTop();
              var newTop = scrollTop + targetTop - ( windowHeight - targetHeight ) / 2;
              //console.log('scrollToLocator found target tag=' + tag +  ' locator=' + locator + ' newTop ' + newTop + ' scrollTop ' + scrollTop + ' targetHeight ' + targetHeight + ' targetTop ' + targetTop + ' windowHeight ' + windowHeight);

              jQuery('.template-container').animate({scrollTop: newTop}, 'fast');

              // focus and maybe select the tag
              if (tag) {
                var e = jQuery("#" + locator + ' ' + tag);
                if (e.length) {
                  e[0].focus();
                  if (!e.is('select')) {
                    e[0].select();
                  }
                }
              }
            }
          };
          $timeout($scope.setHeight, 100);
        }
      };

      $scope.getPageWidth = function () {
        var result = '100%';
        var e = jQuery('.right-body');
        if (e.length > 0) {
          result = e[0].clientWidth + 'px';
        }
        return result;
      };

      // how deeply is this this field nested in the template?
      $scope.getNestingCount = function () {

        var path = $scope.path || '';
        var arr = path.split('-');
        return arr.length;
      };

      // turn the nesting into a px amount
      $scope.getNestingStyle = function () {
        return (-16 * ($scope.getNestingCount() - 2) - 1) + 'px';
      };

      // submit this edit
      $scope.onSubmit = function (index, next) {
        console.log('onSubmit ' + index + next);

        if ($scope.isActive(index)) {

          if (next != null && $scope.isMultipleCardinality() && (next < $scope.model.length)) {
            console.log('setActive ' + next);
            $scope.setActive(next, true);
          } else if ($scope.isMultipleCardinality() && (index + 1 < $scope.model.length)) {
            $scope.setActive(index + 1, true);

          } else {
            // or go to parent's next field
            $scope.$parent.nextChild($scope.field, index, $scope.path);

          }
        } else {
          console.log("error: not active")
        }
      };

      // is this a submit?  shift-enter qualifies as a submit for any field
      $scope.isSubmit = function (keyEvent, index) {

        if (keyEvent.which === 13 && keyEvent.ctrlKey) {
          $scope.onSubmit(index);
        }
      };


      // an array of model values
      $scope.valueArray;
      $scope.setValueArray = function () {

        $scope.valueArray = [];
        if ($scope.isMultiAnswer()) {

          $scope.valueArray.push($scope.model);

        } else if ($scope.model instanceof Array) {

          $scope.valueArray = $scope.model;

        } else {

          if (!$scope.model) {
            $scope.model = {};
          }

          $scope.valueArray = [];
          $scope.valueArray.push($scope.model);

        }
      };
      $scope.setValueArray();

      // handle the multiple option list by using data.model for its model
      $scope.initMultiple = function () {

        $scope.data.model = [];
        if ($scope.model[0] && Array.isArray($scope.model[0])) {

          for (var i = 0; i < $scope.model[0].length; i++) {
            $scope.data.model.push($scope.model[0][i]['@value']);
          }
        }

      };

      // put the multiple selections into our model
      $scope.updateMultiple = function () {

        $scope.model[0] = [];

        for (var i = 0; i < $scope.data.model.length; i++) {
          var obj = {};
          obj["@value"] = $scope.data.model[i];
          $scope.model[0].push(obj);
        }
      };

      // get the printable list of selections
      $scope.getMultiple = function () {
        var result = '';

        var value = $scope.model[0];

        if (Array.isArray(value)) {
          for (var i = 0; i < value.length; i++) {

            result += value[i]['@value'];
            if (i < value.length - 1) {
              result += ', ';
            }
          }

        } else {
          result = value;
        }

        return result;
      };


      $scope.showMultiple = function (state) {
        return ($scope.multipleState === state);
      };

      $scope.cardinalityString = function () {
        return DataManipulationService.cardinalityString($scope.field);
      };

      $scope.toggleMultiple = function () {
        var index = $scope.multipleStates.indexOf($scope.multipleState);
        index = (index + 1) % $scope.multipleStates.length;
        $scope.multipleState = $scope.multipleStates[index];
        if ($scope.multipleState ==='spreadsheet') {
          setTimeout(function () {
            $scope.switchToSpreadsheet();
          }, 0);
        }
        return $scope.multipleState;
      };

      $scope.isRecommended = function () {
        return $rootScope.vrs.getIsValueRecommendationEnabled($rootScope.schemaOf($scope.field));
      };

      $scope.isConstrained = function () {
        return $scope.hasValueConstraint() && !$scope.isRecommended();
      };

      $scope.isRegular = function () {
        return !$scope.isConstrained() && !$scope.isRecommended();
      };

      // strip midnight off the date time string
      $scope.formatDateTime = function (value) {

        var result = value;
        if (value) {

          var index = value.indexOf($scope.midnight);
          if (index != -1) {
            result = value.substring(0, index);
          }
        }
        return result;
      };

      // form has been submitted, look for errors
      $scope.$on('submitForm', function (event) {

        // If field is required and is empty, emit failed emptyRequiredField event
        if ($rootScope.schemaOf($scope.field)._valueConstraints && $rootScope.schemaOf($scope.field)._valueConstraints.requiredValue) {
          var allRequiredFieldsAreFilledIn = true;
          var min = $scope.field.minItems || 0;

          if (angular.isArray($scope.model)) {
            if ($scope.model.length < min) {
              allRequiredFieldsAreFilledIn = false;
            } else {
              angular.forEach($scope.model, function (valueElement) {
                if (!valueElement || !valueElement['@value']) {
                  allRequiredFieldsAreFilledIn = false;
                } else if (angular.isArray(valueElement['@value'])) {
                  var hasValue = false;
                  angular.forEach(valueElement['@value'], function (ve) {
                    hasValue = hasValue || !!ve;
                  });

                  if (!hasValue) {
                    allRequiredFieldsAreFilledIn = false;
                  }
                } else if (angular.isObject(valueElement['@value'])) {
                  if ($rootScope.isEmpty(valueElement['@value'])) {
                    allRequiredFieldsAreFilledIn = false;
                  } else if (DataManipulationService.getFieldSchema($scope.field)._ui.dateType == "date-range") {
                    if (!valueElement['@value'].start || !valueElement['@value'].end) {
                      allRequiredFieldsAreFilledIn = false;
                    }
                  } else {
                    // Require at least one checkbox is checked.
                    var hasValue = false;
                    angular.forEach(valueElement['@value'], function (value, key) {
                      hasValue = hasValue || value;
                    });

                    if (!hasValue) {
                      allRequiredFieldsAreFilledIn = false;
                    }
                  }
                }
              });
            }
          } else {
            // allRequiredFieldsAreFilledIn = false;
            if (!$scope.model || !$scope.model['@value']) {
              allRequiredFieldsAreFilledIn = false;
            } else if (angular.isArray($scope.model['@value'])) {
              var hasValue = false;
              angular.forEach($scope.model['@value'], function (ve) {
                hasValue = hasValue || !!ve;
              });

              if (!hasValue) {
                allRequiredFieldsAreFilledIn = false;
              }
            } else if (angular.isObject($scope.model['@value'])) {
              if ($rootScope.isEmpty($scope.model['@value'])) {
                allRequiredFieldsAreFilledIn = false;
              } else if (DataManipulationService.getFieldSchema($scope.field)._ui.dateType == "date-range") {
                if (!$scope.model['@value'].start || !$scope.model['@value'].end) {
                  allRequiredFieldsAreFilledIn = false;
                }
              } else {
                // Require at least one checkbox is checked.
                var hasValue = false;
                angular.forEach($scope.model['@value'], function (value, key) {
                  hasValue = hasValue || value;
                });

                if (!hasValue) {
                  allRequiredFieldsAreFilledIn = false;
                }
              }
            }
          }

          if (!allRequiredFieldsAreFilledIn) {
            // add this field instance the the emptyRequiredField array
            $scope.$emit('emptyRequiredField',
                ['add', DataManipulationService.getFieldSchema($scope.field)._ui.title, $scope.uuid]);
          }
        }

        // If field is required and is not empty, check to see if it needs to be removed from empty fields array
        if ($rootScope.schemaOf($scope.field)._valueConstraints &&
            $rootScope.schemaOf($scope.field)._valueConstraints.requiredValue && allRequiredFieldsAreFilledIn) {
          //remove from emptyRequiredField array
          $scope.$emit('emptyRequiredField',
              ['remove', $scope.getTitle($scope.field), $scope.uuid]);
        }


        var allFieldsAreValid = true;
        if (angular.isArray($scope.model)) {
          for (var i = 0; i < $scope.model.length; i++) {
            if (!DataManipulationService.isValidPattern($scope.field, i)) {
              $scope.model[i]['@value'] = DataManipulationService.getDomValue($scope.field, i);
              allFieldsAreValid = false;
            }
          }

        } else {
          if (!DataManipulationService.isValidPattern($scope.field, 0)) {
            $scope.model['@value'] = DataManipulationService.getDomValue($scope.field, 0);
            allFieldsAreValid = false;

          }
        }

        if ($rootScope.hasValueConstraint($rootScope.schemaOf($scope.field)._valueConstraints)) {

          if (angular.isArray($scope.model)) {
            angular.forEach($scope.model, function (valueElement) {
              if (angular.isArray(valueElement['@value'])) {
                angular.forEach(valueElement['@value'], function (ve) {
                  if (!$rootScope.isValueConformedToConstraint(ve, $scope.field["@id"],
                          $rootScope.schemaOf($scope.field)._valueConstraints)) {
                    allFieldsAreValid = false;
                  }
                });
              } else if (angular.isObject(valueElement['@value'])) {
                if (!$rootScope.isValueConformedToConstraint(valueElement['@value'], $scope.field["@id"],
                        $rootScope.schemaOf($scope.field)._valueConstraints)) {
                  allFieldsAreValid = false;
                }
              }
            });
          } else {
            if (angular.isArray($scope.model['@value'])) {
              angular.forEach($scope.model['@value'], function (ve) {
                if (!$rootScope.isValueConformedToConstraint(ve, $scope.field["@id"],
                        $rootScope.schemaOf($scope.field)._valueConstraints)) {
                  allFieldsAreValid = false;
                }
              });
            } else if (angular.isObject($scope.model['@value'])) {
              if (!$rootScope.isValueConformedToConstraint($scope.model['@value'], $scope.field["@id"],
                      $rootScope.schemaOf($scope.field)._valueConstraints)) {
                allFieldsAreValid = false;
              }
            }
          }
        }

        $scope.$emit('invalidFieldValues',
            [allFieldsAreValid ? 'remove' : 'add', DataManipulationService.getFieldSchema($scope.field)._ui.title,
             $scope.uuid]);

      });

      // form has been saved, look for errors
      $scope.$on("saveForm", function () {

        var id = DataManipulationService.getId($scope.field);
        var title = DataManipulationService.getTitle($scope.field);
        var action = ($scope.isEditState() && !$scope.canDeselect($scope.field)) ? 'add' : 'remove';

        $scope.$emit("invalidFieldState", [action, title, id]);

      });


    };

    return {
      templateUrl: 'scripts/form/cedar-runtime-field.directive.html',
      restrict   : 'EA',
      scope      : {
        field         : '=',
        model         : '=',
        renameChildKey: "=",
        preview       : "=",
        delete        : '&',
        ngDisabled    : "=",
        path          : '=',
        previous      : '='

      },
      controller : function ($scope, $element) {
        var addPopover = function ($scope) {
          //Initializing Bootstrap Popover fn for each item loaded
          setTimeout(function () {
            if ($element.find('#field-value-tooltip').length > 0) {
              $element.find('#field-value-tooltip').popover();
            } else if ($element.find('[data-toggle="popover"]').length > 0) {
              $element.find('[data-toggle="popover"]').popover();
            }
          }, 1000);
        };

        addPopover($scope);

      },
      replace    : true,
      link       : linker
    };

  }

})
;