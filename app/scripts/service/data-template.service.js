'use strict';

define([
  'angular',
  'json!resources/field-empty.json',
  'json!resources/field-static-empty.json',
  'json!resources/element-empty.json',
  'json!resources/template-empty.json'
], function (angular, emptyField, emptyStaticField, emptyElement, emptyTemplate) {
  angular.module('cedar.templateEditor.service.dataTemplateService', [])
      .service('DataTemplateService', DataTemplateService);

  DataTemplateService.$inject = [];

  function DataTemplateService() {
    var dataTemplate = {};

    var service = {
      serviceId: "DataTemplateService"
    };

    service.init = function () {
      dataTemplate.field = emptyField;
      dataTemplate.staticField = emptyStaticField;
      dataTemplate.element = emptyElement;
      dataTemplate.template = emptyTemplate;
    };

    service.getField = function (tempId) {
      var clonedField = angular.copy(dataTemplate.field);
      clonedField['@id'] = tempId;
      setSchemaVersion(clonedField);
      return clonedField;
    };

    service.getStaticField = function (tempId) {
      var clonedField = angular.copy(dataTemplate.staticField);
      clonedField['@id'] = tempId;
      setSchemaVersion(clonedField);
      return clonedField;
    };

    service.getElement = function () {
      var clonedElement = angular.copy(dataTemplate.element);
      setSchemaVersion(clonedElement);
      return clonedElement;
    };

    service.getTemplate = function () {
      var clonedTemplate = angular.copy(dataTemplate.template);
      setSchemaVersion(clonedTemplate);
      return clonedTemplate;
    };

    /**
     * Sets the version of the CEDAR Template Model
     * @param schema - template, element, or field
     */
    var setSchemaVersion = function (schema) {
      // TODO: read it from config file
      var SCHEMA_VERSION = '1.1.0';
      schema['schema:schemaVersion'] = SCHEMA_VERSION;
    };

    return service;

  };

});
