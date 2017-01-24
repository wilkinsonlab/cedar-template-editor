'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.templateElement.createElementController', [])
      .controller('CreateElementController', CreateElementController);

  CreateElementController.$inject = ["$rootScope", "$scope", "$routeParams", "$timeout", "$location", "$translate",
                                     "$filter", "HeaderService", "StagingService", "DataTemplateService",
                                     "FieldTypeService", "TemplateElementService", "UIMessageService",
                                     "DataManipulationService", "DataUtilService", "AuthorizedBackendService",
                                     "FrontendUrlService", "QueryParamUtilsService", "CONST"];


  function CreateElementController($rootScope, $scope, $routeParams, $timeout, $location, $translate, $filter,
                                   HeaderService, StagingService, DataTemplateService, FieldTypeService,
                                   TemplateElementService, UIMessageService, DataManipulationService, DataUtilService,
                                   AuthorizedBackendService, FrontendUrlService, QueryParamUtilsService, CONST) {

    $rootScope.showSearch = true;

    $rootScope.searchBrowseModalId = "search-browse-modal";
    $rootScope.finderModalId = "finder-modal";

    // Set page title variable when this controller is active
    $rootScope.pageTitle = 'Element Designer';
    // Setting default false flag for $scope.favorite
    //$scope.favorite = false;
    // Empty $scope object used to store values that get converted to their json-ld counterparts on the $scope.element object
    $scope.volatile = {};
    // Setting form preview setting to false by default
    //$scope.form = {};

    $scope.showCreateEditForm = true;

    var pageId = CONST.pageId.ELEMENT;
    HeaderService.configure(pageId);
    StagingService.configure(pageId);

    $scope.primaryFieldTypes = FieldTypeService.getPrimaryFieldTypes();
    $scope.otherFieldTypes = FieldTypeService.getOtherFieldTypes();
    $scope.hideRootElement = true;

    $scope.saveButtonDisabled = false;

    var getElement = function () {
      $scope.form = {};
      // Load existing element if $routeParams.id parameter is supplied
      if ($routeParams.id) {
        // Fetch existing element and assign to $scope.element property
        AuthorizedBackendService.doCall(
            TemplateElementService.getTemplateElement($routeParams.id),
            function (response) {
              $scope.element = response.data;
              HeaderService.dataContainer.currentObjectScope = $scope.element;

              var key = $scope.element["@id"];
              $rootScope.keyOfRootElement = key;
              $rootScope.rootElement = $scope.form;
              $scope.form.properties = $scope.form.properties || {};
              $scope.form.properties[key] = $scope.element;
              $scope.form._ui = $scope.form._ui || {};
              $scope.form._ui.order = $scope.form._ui.order || [];
              $scope.form._ui.order.push(key);
              $rootScope.jsonToSave = $scope.element;
              $rootScope.documentTitle = $scope.form._ui.title;

              $scope.$broadcast('form:clean');
            },
            function (err) {
              UIMessageService.showBackendError('SERVER.ELEMENT.load.error', err);
            }
        );
      } else {
        // If we're not loading an existing element then let's create a new empty $scope.element property
        $scope.element = DataTemplateService.getElement();
        HeaderService.dataContainer.currentObjectScope = $scope.element;

        var key = $scope.element["@id"] || DataManipulationService.generateGUID();
        $rootScope.keyOfRootElement = key;
        $rootScope.rootElement = $scope.form;
        $scope.form.properties = $scope.form.properties || {};
        $scope.form.properties[key] = $scope.element;
        $scope.form._ui = $scope.form._ui || {};
        $scope.form._ui.order = $scope.form._ui.order || [];
        $scope.form._ui.order.push(key);
        $rootScope.jsonToSave = $scope.element;

        $scope.$broadcast('form:clean');
      }
    };
    getElement();

    var populateCreatingFieldOrElement = function () {
      $scope.invalidFieldStates = {};
      $scope.invalidElementStates = {};
      $scope.$broadcast('saveForm');
    }

    var dontHaveCreatingFieldOrElement = function () {
      return $rootScope.isEmpty($scope.invalidFieldStates) && $rootScope.isEmpty($scope.invalidElementStates);
    }

    // *** proxied functions
    // Return true if element.properties object only contains default values
    $scope.isPropertiesEmpty = function () {
      return DataUtilService.isPropertiesEmpty($scope.element);
    };

    // Add newly configured field to the element object
    $scope.addField = function (fieldType) {
      populateCreatingFieldOrElement();
      if (dontHaveCreatingFieldOrElement()) {
        StagingService.addFieldToElement($scope.element, fieldType);
        $scope.$broadcast("form:dirty");
      }
      $scope.showMenuPopover = false;
    };

    $scope.addElementToElement = function (element) {
      populateCreatingFieldOrElement();
      if (dontHaveCreatingFieldOrElement()) {
        DataManipulationService.createDomIds(element);
        StagingService.addElementToElement($scope.element, element["@id"]);
        $scope.$broadcast("form:update");
      }
    };

    $scope.backToFolder = function () {
      $location.url(FrontendUrlService.getFolderContents(QueryParamUtilsService.getFolderId()));
    };

    // Reverts to empty form and removes all previously added fields/elements
    $scope.reset = function () {
      UIMessageService.confirmedExecution(
          function () {
            $timeout(function () {
              $scope.doReset();
              // StagingService.resetPage();
            });
          },
          'GENERIC.AreYouSure',
          'ELEMENTEDITOR.clear.confirm',
          'GENERIC.YesClearIt'
      );
    };

    $scope.doReset = function () {
      $scope.element = angular.copy($scope.resetElement);
      // Broadcast the reset event which will trigger the emptying of formFields formFieldsOrder
      $scope.$broadcast('form:reset');
    };

    $scope.saveElement = function () {
      populateCreatingFieldOrElement();
      if (dontHaveCreatingFieldOrElement()) {
        UIMessageService.conditionalOrConfirmedExecution(
            StagingService.isEmpty(),
            function () {
              $scope.doSaveElement();
            },
            'GENERIC.AreYouSure',
            'ELEMENTEDITOR.save.nonEmptyStagingConfirm',
            'GENERIC.YesSaveIt'
        );
      }
    };

    // Stores the element into the database
    $scope.doSaveElement = function () {
      //console.log("doSaveElement")
      // First check to make sure Element Name, Element Description are not blank
      $scope.elementErrorMessages = [];
      $scope.elementSuccessMessages = [];
      // delete $scope.element._ui.is_root;

      //// If Element Name is blank, produce error message
      //if (!$scope.element._ui.title.length) {
      //  $scope.elementErrorMessages.push($translate.instant("VALIDATION.elementNameEmpty"));
      //}
      //// If Element Description is blank, produce error message
      //if (!$scope.element._ui.description.length) {
      //  $scope.elementErrorMessages.push($translate.instant("VALIDATION.elementDescriptionEmpty"));
      //}
      // If there are no Element level error messages
      if ($scope.elementErrorMessages.length == 0) {
        // Build element 'order' array via $broadcast call
        // $scope.$broadcast('initOrderArray');
        // Console.log full working form example on save, just to show demonstration of something happening
        //console.log('saving element...');
        //console.log($scope.element);

        // If maxItems is N, then remove maxItems
        DataManipulationService.removeUnnecessaryMaxItems($scope.element.properties);
        DataManipulationService.defaultTitleAndDescription($scope.element._ui);

        // create a copy of the element and strip out the _tmp fields before saving it
        // var copiedElement = $scope.stripTmpFields();

        this.disableSaveButton();
        var owner = this;
        // Save element
        // Check if the element is already stored into the DB
        if ($routeParams.id == undefined) {
          DataManipulationService.stripTmps($scope.element);

          AuthorizedBackendService.doCall(
              TemplateElementService.saveTemplateElement(QueryParamUtilsService.getFolderId(), $scope.element),
              function (response) {
                // confirm message
                UIMessageService.flashSuccess('SERVER.ELEMENT.create.success',
                    {"title": response.data._ui.title},
                    'GENERIC.Created');
                // Reload page with element id
                var newId = response.data['@id'];
                DataManipulationService.createDomIds(response.data);
                $location.path(FrontendUrlService.getElementEdit(newId));

                $scope.$broadcast('form:clean');
              },
              function (err) {
                UIMessageService.showBackendError('SERVER.ELEMENT.create.error', err);
                owner.enableSaveButton();
              }
          );
        }
        // Update element
        else {
          var id = $scope.element['@id'];
          //--//delete $scope.element['@id'];
          DataManipulationService.stripTmps($scope.element);

          AuthorizedBackendService.doCall(
              TemplateElementService.updateTemplateElement(id, $scope.element),
              function (response) {
                angular.extend($scope.element, response.data);
                $rootScope.jsonToSave = $scope.element;

                DataManipulationService.createDomIds($scope.element);
                UIMessageService.flashSuccess('SERVER.ELEMENT.update.success', {"title": response.data.title},
                    'GENERIC.Updated');

                owner.enableSaveButton();
                $scope.$broadcast('form.clean');

              },
              function (err) {
                UIMessageService.showBackendError('SERVER.ELEMENT.update.error', err);
                owner.enableSaveButton();
              }
          );
        }
      }
    }

    $scope.invalidFieldStates = {};
    $scope.invalidElementStates = {};
    $scope.$on('invalidFieldState', function (event, args) {
      if (args[2] != $scope.element["@id"]) {
        if (args[0] == 'add') {
          $scope.invalidFieldStates[args[2]] = args[1];
        }
        if (args[0] == 'remove') {
          delete $scope.invalidFieldStates[args[2]];
        }
      }
    });
    $scope.$on('invalidElementState', function (event, args) {
      if (args[0] == 'add') {
        $scope.invalidElementStates[args[2]] = args[1];
      }
      if (args[0] == 'remove') {
        delete $scope.invalidElementStates[args[2]];
      }
    });

    // This function watches for changes in the _ui.title field and autogenerates the schema title and description fields
    $scope.$watch('element._ui.title', function (v) {
      if (!angular.isUndefined($scope.element)) {
        var title = $scope.element._ui.title;
        if (title.length > 0) {
          var capitalizedTitle = $filter('capitalizeFirst')(title);
          $scope.element.title = $translate.instant(
              "GENERATEDVALUE.elementTitle",
              {title: capitalizedTitle}
          );
          $scope.element.description = $translate.instant(
              "GENERATEDVALUE.elementDescription",
              {title: capitalizedTitle}
          );
        } else {
          $scope.element.title = "";
          $scope.element.description = "";
        }
        $rootScope.documentTitle = title;
      }
    });

    // This function watches for changes in the form and defaults the title and description fields
    $scope.$watch('$scope.element', function (v) {
      if ($scope.element && $rootScope.schemaOf($scope.element)) {
        if (!$rootScope.schemaOf($scope.element)._ui.title) {
          $rootScope.schemaOf($scope.element)._ui.title = $translate.instant("VALIDATION.noNameElement");
        }
        if (!$rootScope.schemaOf($scope.element)._ui.description) {
          $rootScope.schemaOf($scope.element)._ui.description = $translate.instant("VALIDATION.noDescriptionElement");
        }
      }
    });

    // create a copy of the form with the _tmp fields stripped out
    $scope.stripTmpFields = function () {
      var copiedForm = jQuery.extend(true, {}, $scope.form);
      if (copiedForm) {
        DataManipulationService.stripTmps(copiedForm);
      }
      return copiedForm;
    };

    $scope.cancelElement = function () {
      $location.url(FrontendUrlService.getFolderContents(QueryParamUtilsService.getFolderId()));
    };

    $scope.elementSearch = function () {
      jQuery("body").trigger("click");
      jQuery("#" + $scope.searchBrowseModalId).modal("show");
    }

    $scope.addElementFromPicker = function () {
      if ($scope.pickerResource) {
        $scope.addElementToElement($scope.pickerResource);
      }
      $scope.hideSearchBrowsePicker();
    };

    $scope.pickElementFromPicker = function (resource) {
      $scope.addElementToElement(resource);
      $scope.hideSearchBrowsePicker();
    };

    $scope.selectElementFromPicker = function (resource) {
      $scope.pickerResource = resource;
    };

    $scope.showSearchBrowsePicker = function () {
      $scope.pickerResource = null;
    };

    $scope.hideSearchBrowsePicker = function () {
      jQuery("#" + $scope.searchBrowseModalId).modal('hide')
    };

    // finder
    $scope.elementFind = function () {
      jQuery("body").trigger("click");
      jQuery("#" + $scope.finderModalId).modal("show");
    };

    $scope.addElementFromFinder = function () {
      if ($scope.finderResource) {
        $scope.addElementToTemplate($scope.finderResource);
      }
      $scope.hideFinder();
    };

    $scope.showFinder = function () {
      $scope.finderResource = null;
    };

    $scope.hideFinder = function () {
      jQuery("#" + $scope.finderModalId).modal('hide');
    };

    $scope.enableSaveButton = function () {
      $timeout(function () {
        $scope.saveButtonDisabled = false;
      }, 1000);
    };

    $scope.disableSaveButton = function () {
      $scope.saveButtonDisabled = true;
    };

  }

});
