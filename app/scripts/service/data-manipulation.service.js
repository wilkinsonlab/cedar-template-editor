'use strict';

define([
      'angular',
      'json!config/data-manipulation-service.conf.json'
    ], function (angular, config) {
      angular.module('cedar.templateEditor.service.dataManipulationService', [])
          .service('DataManipulationService', DataManipulationService);

      DataManipulationService.$inject = ['DataTemplateService', 'DataUtilService', 'UrlService', 'FieldTypeService',
                                         '$rootScope', "ClientSideValidationService", "$translate"];

      function DataManipulationService(DataTemplateService, DataUtilService, UrlService, FieldTypeService, $rootScope,
                                       ClientSideValidationService, $translate) {

        // Base path to generate field ids
        // TODO: fields will be saved as objects on server, they will get their id there
        // TODO: need to assign a temporary id, which will be replaced on server side
        var idBasePath = null;


        var service = {
          serviceId: "DataManipulationService"
        };

        service.init = function () {
          idBasePath = config.idBasePath;
        };

        // Function that generates a basic field definition
        service.generateField = function (fieldType) {
          var valueType = ["string", "null"];
          if ((fieldType == "checkbox") || (fieldType == "list") || (fieldType == "radio")) {
            valueType = ["array", "null"];
          }

          var field;
          if (FieldTypeService.isStaticField(fieldType)) {
            field = DataTemplateService.getStaticField(this.generateTempGUID());
          } else {
            field = DataTemplateService.getField(this.generateTempGUID());
            field.properties['@value'].type = valueType;
          }
          field._ui.inputType = fieldType;

          // Constrain the @type of @value according to the field type
          var valueAtType = null;
          if (fieldType == 'date' || fieldType == 'numeric') {
            valueAtType = {};
            valueAtType.type = 'string';
            valueAtType.format = 'uri';
            if (fieldType == 'date') {
              //valueAtType.enum = ['xsd:dateTime'];
              // Make @type required
              field.required.push('@type');
            }
            else if (fieldType == 'numeric') {
              //valueAtType.enum = ['xsd:decimal'];
              // Make @type required
              field.required.push('@type');
            }
            delete field.properties['@type'];
            field.properties['@type'] = valueAtType;
          }

          return field;
        };

        // Function that generates a basic field definition
        service.isStaticField = function (field) {
          var schema = $rootScope.schemaOf(field);
          var type = schema._ui.inputType;
          return FieldTypeService.isStaticField(type);
        };

        // Function that generates the @context for an instance, based on the schema @context definition
        service.generateInstanceContext = function (schemaContext) {
          var context = {};
          angular.forEach(schemaContext.properties, function (value, key) {
            if (value.type == "object") {
              context[key] = {};
              angular.forEach(schemaContext.properties[key].properties, function (value2, key2) {
                if (value2.enum) {
                  context[key][key2] = value2.enum[0];
                }
              });
            }
            else {
              if (value.enum) {
                context[key] = value.enum[0];
              }
            }
          });
          return context;
        };

        // Function that generates the @type for a field in an instance, based on the schema @type definition
        service.generateInstanceType = function (schemaType) {
          var instanceType = null;
          var enumeration = {};
          if (angular.isUndefined(schemaType.oneOf)) {
            enumeration = schemaType.enum;
          }
          else {
            enumeration = schemaType.oneOf[0].enum;
          }
          // If the type is defined at the schema level
          if (angular.isDefined(enumeration)) {
            // If only one type has been defined, it is returned
            if (enumeration.length == 1) {
              instanceType = enumeration[0];
              // If more than one type have been defined for the template/element/field, an array is returned
            } else {
              instanceType = enumeration;
            }
          }
          return instanceType;
        };

        service.generateInstanceTypeForDateField = function() {
          return "xsd:date";
        };

        service.generateInstanceTypeForNumericField = function() {
          return "xsd:decimal";
        };

        // returns the properties of a template, element, or field schema
        service.getProperties = function(schema) {
          return $rootScope.schemaOf(schema).properties;
        };

        // If necessary, updates the field schema according to whether the field is controlled or not
        service.initializeSchema = function (field) {
          var fieldSchema = $rootScope.schemaOf(field);
          // If regular field
          if (!service.hasValueConstraint(field)) {
            if (fieldSchema.required[0] != "@value") {
              fieldSchema.required = [];
              fieldSchema.required.push("@value")
            }
            if (angular.isUndefined(fieldSchema.properties["@value"])) {
              var valueField = {};
              valueField.type = [];
              valueField.type.push("string");
              valueField.type.push("null");
              fieldSchema.properties["@value"] = valueField;
              delete fieldSchema.properties["@id"];
            }
          }
          // If controlled field
          else {
            if (fieldSchema.required[0] != "@id") {
              fieldSchema.required = [];
              fieldSchema.required.push("@id")
            }
            if (angular.isUndefined(fieldSchema.properties["@id"])) {
              var idField = {};
              idField.type = [];
              idField.type.push("string");
              idField.type.push("null");
              idField.format = "uri";
              fieldSchema.properties["@id"] = idField;
              delete fieldSchema.properties["@value"];
            }
          }
        };

        // This function initializes the model to array or object, depending on the field type. The 'force' parameter forces
        // the initialization even if the model is defined and contains items
        service.initializeModel = function (field, model, force) {
          // Checkbox or multiple-choice list
          if (service.isMultipleChoiceField(field)) {
            if (!model || !$rootScope.isArray(model)) {
              model = [];
            }
            else if (force) {
              // Remove all elements from the 'model' array if not empty. Note that using $scope.model = []
              // may not work because there are references to the original array
              model.splice(0);
            }
          }
          // Radio or single-choice list. They store only one value.
          else if (service.isSingleChoiceListField(field)) {
            if (!model || $rootScope.isArray(model)) {
              model = {};
            }
          }
          return model;
        };

        // This function initializes the @value field (in the model) to null if it has not been initialized yet. Note that
        // the @id field can't be initialized to null. In JSON-LD, @id must be a string, so we don't initialize it.
        service.initializeValue = function (field, model) {
          var fieldValue = service.getValueLocation(field);
          if (fieldValue == "@value") {
            // Not an array
            if (!$rootScope.isArray(model)) {
              if (!model) {
                model = {};
              }
              // Value field has been defined
              if (model.hasOwnProperty(fieldValue)) {
                // If undefined value or empty string
                if ((angular.isUndefined(
                        model[fieldValue])) || ((model[fieldValue]) && (model[fieldValue].length == 0))) {
                  model[fieldValue] = null;
                }
              }
              // Value field has not been defined
              else {
                model[fieldValue] = null;
              }
            }
            // An array
            else {
              // Length is 0
              if (model.length == 0) {
                model.push({});
                model[0][fieldValue] = null;
              }
              // If length > 0
              else {
                for (var i = 0; i < model.length; i++) {
                  service.initializeValue(field, model[i]);
                }
              }
            }
          }
        };

        service.getDefaultValue = function(fieldValue) {
          if (fieldValue == "@value") {
            return null;
          }
          // Otherwise don't return anything because the @id field can't be initialized to null
        }

        // Sets the default selections for multi-answer fields
        service.defaultOptionsToModel = function (field, model) {
          if (service.isMultiAnswer(field)) {
            var literals = service.getLiterals(field);
            var fieldValue = service.getValueLocation(field);
            // Checkbox or multi-choice  list
            if (service.isMultipleChoiceField(field)) {
              for (var i = 0; i < literals.length; i++) {
                if (literals[i].selectedByDefault) {
                  var newValue = {};
                  newValue[fieldValue] = literals[i].label;
                  model.push(newValue);
                }
              }
            }
            // Radio or single-choice list
            else if (service.isSingleChoiceListField(field)) {
              for (var i = 0; i < literals.length; i++) {
                if (literals[i].selectedByDefault) {
                  model[fieldValue] = literals[i].label;
                  break;
                }
              }
            }
          }
        };

        // Removes empty strings from the model. This function is used to remove the empty string generated by the
        // 'Nothing selected' option in single-selection fields
        service.removeEmptyStrings = function (field, model) {
          var fieldValue = service.getValueLocation(field);
          if ($rootScope.isArray(model)) {
            for (var i = model.length - 1; i >= 0; i--) {
              if (model[i][fieldValue] == "") {
                model.splice(i, 1);
              }
            }
          }
          else {
            if (model[fieldValue] == "") {
              delete model[fieldValue];
            }
          }
        }

        // Initializes the value @type field.
        // Note that for 'date' and 'numeric' fields, the field schema is flexible, allowing any string as a type.
        // Users may want to manually create instances that use different date or numeric types (e.g., xsd:integer).
        // As a consequence, we cannot use the @type definition from the schema to generate the @type for the instance
        // field. We 'manually' generate those types.
        service.initializeValueType = function (field, model) {
          var fieldType;
          if (service.isNumericField(field)) {
            fieldType = service.generateInstanceTypeForNumericField();
          }
          else if (service.isDateField(field)) {
            fieldType = service.generateInstanceTypeForDateField();
          }
          else {
            var properties = service.getProperties(field);
            if (properties && !angular.isUndefined(properties['@type'])) {
              fieldType = service.generateInstanceType(properties['@type']);
            }
          }
          if (fieldType) {
            // It is not an array
            if (field.type == 'object') {
              // If the @type has not been defined yet, define it
              if (angular.isUndefined(model['@type'])) {
                // No need to set the type if it is xsd:string. It is the type by default
                if (fieldType != "xsd:string") {
                  model['@type'] = fieldType;
                }
              }
            }
            // It is an array
            else if (field.type == 'array') {
              for (var i = 0; i < model.length; i++) {
                // If there is an item in the array for which the @type has not been defined, define it
                if (angular.isUndefined(model[i]['@type'])) {
                  // No need to set the type if it is xsd:string. It is the type by default
                  if (fieldType != "xsd:string") {
                    model[i]['@type'] = fieldType;
                  }
                }
              }
            }
          }
        };

        // where is the value of this field, @id or @value?
        service.getValueLocation = function (field) {
          // usually it is in  @value
          var fieldValue = "@value";
          // but these two put it @id
          if (service.hasValueConstraint(field) || service.isLinkType(field)) {
            fieldValue = "@id";
          }
          return fieldValue;
        };

        // where is the value that we show the user?
        service.getValueLabelLocation = function (field) {
          // the printable value is usually in @value
          var location = "@value";
          // but a link puts it in @id
          if (service.isLinkType(field)) {
            location = "@id";
            // and the constraint puts it _valueLabel
          } else if (service.hasValueConstraint(field)) {
            location = "_valueLabel";
          }
          return location;
        };

        // resolve min or max as necessary and cardinalize or uncardinalize field
        service.setMinMax = function (field) {
          if (!field.hasOwnProperty('minItems') || typeof field.minItems == 'undefined' || field.minItems < 0) {
            delete field.minItems;
            delete field.maxItems;
          } else if (field.hasOwnProperty('maxItems') && field.maxItems < 0) {
            delete field.maxItems;
          }

          if (!service.uncardinalizeField(field)) {
            service.cardinalizeField(field);
          }
        };

        service.cardinalizeField = function (field) {
          if (typeof(field.minItems) != 'undefined' && !field.items) {

            field.items = {
              '$schema'             : field.$schema,
              'type'                : field.type,
              '@id'                 : field['@id'],
              '@type'               : field['@type'],
              '@context'            : field['@context'],
              'title'               : $translate.instant("GENERATEDVALUE.fieldTitle", {title: field._ui.title}),
              'description'         : $translate.instant("GENERATEDVALUE.fieldDescription",
                  {title: field._ui.title, version: window.cedarVersion}),
              '_ui'                 : field._ui,
              '_valueConstraints'   : field._valueConstraints,
              'properties'          : field.properties,
              'required'            : field.required,
              'additionalProperties': field.additionalProperties,
              'pav:createdOn'       : field['pav:createdOn'],
              'pav:createdBy'       : field['pav:createdBy'],
              'pav:lastUpdatedOn'   : field['pav:lastUpdatedOn'],
              'oslc:modifiedBy'     : field['oslc:modifiedBy'],
              'schema:schemaVersion': field['schema:schemaVersion']
            };
            field.type = 'array';

            delete field.$schema;
            delete field['@id'];
            delete field['@type'];
            delete field['@context'];
            delete field.properties;
            delete field.title;
            delete field.description;
            delete field._ui;
            delete field._valueConstraints;
            delete field.required;
            delete field.additionalProperties;
            delete field['pav:createdOn'];
            delete field['pav:createdBy'];
            delete field['pav:lastUpdatedOn'];
            delete field['oslc:modifiedBy'];
            delete field['schema:schemaVersion'];

            return true;
          } else {
            return false;
          }
        };

        service.uncardinalizeField = function (field) {
          if (typeof field.minItems == 'undefined' && field.items) {

            field.$schema = field.items.$schema;
            field.type = 'object';
            field['@id'] = field.items["@id"];
            field['@type'] = field.items["@type"];
            field['@context'] = field.items["@context"];
            field.title = field.items.title;
            field.description = field.items.description;
            field._ui = field.items._ui;
            field._valueConstraints = field.items._valueConstraints;
            field.properties = field.items.properties;
            field.required = field.items.required;
            field.additionalProperties = field.items.additionalProperties;
            field['pav:createdOn'] = field.items['pav:createdOn'];
            field['pav:createdBy'] = field.items['pav:createdBy'];
            field['pav:lastUpdatedOn'] = field.items['pav:lastUpdatedOn'];
            field['oslc:modifiedBy'] = field.items['oslc:modifiedBy'];
            field['schema:schemaVersion'] = field.items['schema:schemaVersion'];

            delete field.items;
            delete field.maxItems;


            return true;
          } else {
            return false;
          }
        };

        service.isCardinalElement = function (element) {
          return element.type == 'array';
        };

        // If Max Items is N, its value will be 0, then need to remove it from schema
        // if Min and Max are both 1, remove them
        service.removeUnnecessaryMaxItems = function (properties) {
          angular.forEach(properties, function (value, key) {
            if (!DataUtilService.isSpecialKey(key)) {
              if ((value.minItems == 1 && value.maxItems == 1)) {
                delete value.minItems;
                delete value.maxItems;
              }
              if (value.maxItems == 0) {
                delete value.maxItems;
              }
            }
          });
        };

        // set a title and description in the object if there is none
        service.defaultTitleAndDescription = function (obj) {
          if (!obj.title || !obj.title.length) {
            obj.title = $translate.instant("GENERIC.Untitled");
          }
          if (!obj.description || !obj.description.length) {
            obj.description = $translate.instant("GENERIC.Description");
          }
        };

        service.getDivId = function (node) {

          var elProperties = service.getFieldProperties(node);
          return elProperties._tmp.divId;

        };

        service.getFieldProperties = function (field) {
          if (field) {
            if (field.type == 'array' && field.items && field.items.properties) {
              return field.items.properties;
            } else {
              return field.properties;
            }
          }
        };

        // Returns the field schema. If the field is defined as an array, this function will return field.items, because the schema is defined at that level.
        service.getFieldSchema = function (field) {
          if (field) {
            if (field.type == 'array' && field.items) {
              return field.items;
            } else {
              return field;
            }
          }
        };

        // is this a nested field?
        service.isNested = function (field) {
          var p = $rootScope.propertiesOf(field);
          p._tmp = p._tmp || {};
          return (p._tmp.nested || false);
        };

        // is this a numeric field?
        service.isNumericField = function(field) {
          var inputType = service.getInputType(field);
          if (inputType == 'numeric') {
            return true;
          }
          else {
            return false;
          }
        };

        // is this a date field?
        service.isDateField = function(field) {
          var inputType = service.getInputType(field);
          if (inputType == 'date') {
            return true;
          }
          else {
            return false;
          }
        };

        // are we editing this field?
        service.isEditState = function (field) {
          var p = $rootScope.propertiesOf(field);
          p._tmp = p._tmp || {};
          return (p._tmp.state == "creating");
        };

        // set as selected
        service.setSelected = function (field) {
          var p = $rootScope.propertiesOf(field);
          p._tmp = p._tmp || {};
          p._tmp.state = "creating";

          $rootScope.selectedFieldOrElement = field;
        };

        // is this an array of fields or elements?
        service.isMultiple = function (obj) {
          return $rootScope.isArray(obj);
        };

        // is the field multiple cardinality?
        service.isMultipleCardinality = function (fieldOrElement) {
          return fieldOrElement.items;
        };

        service.cardinalityString = function (fieldOrElement) {
          var result = '';
          if (service.isMultipleCardinality(fieldOrElement)) {
            result = '[' + fieldOrElement.minItems + '...' + (fieldOrElement.maxItems || 'N') + ']';
          }
          return result;
        };

        // what is the field type?
        service.getInputType = function(field) {
          return $rootScope.schemaOf(field)._ui.inputType;
        };

        service.defaultMinMax = function (fieldOrElement) {
          fieldOrElement.minItems = 1;
          fieldOrElement.maxItems = 0;
        };

        service.clearMinMax = function (fieldOrElement) {
          delete fieldOrElement.minItems;
          delete fieldOrElement.maxItems;
        };

        // what is the max cardinality?
        service.getMaxItems = function (fieldOrElement) {
          return fieldOrElement.maxItems;
        };

        // what is the min cardinality?
        service.getMinItems = function (fieldOrElement) {
          return fieldOrElement.minItems;
        };


        // is this field required?
        service.isRequired = function (fieldOrElement) {
          return $rootScope.schemaOf(fieldOrElement)._valueConstraints.requiredValue;
        };

        // is the previous field static?
        // service.isDateRange = function (fieldOrElement) {
        //   return DataManipulationService.getFieldSchema(fieldOrElement)._ui.dateType == "date-range";
        // };

        service.hasNext = function (fieldOrElement) {
          return true;
        };

        // set this field instance active
        service.setActive = function (field, index, path, uid, value) {
          if (value) {
            $rootScope.activeLocator = service.getLocator(field, index, path, uid);
          } else {
            $rootScope.activeLocator = null;
          }

        };

        // is this field active
        service.isActive = function (locator) {
          return ($rootScope.activeLocator === locator);
        };

        // is some other field active
        service.isInactive = function (locator) {
          return ($rootScope.activeLocator && $rootScope.activeLocator != locator);
        };

        // add an option to this field
        service.addOption = function (field) {
          var emptyOption = {
            "label": ""
          };
          field._valueConstraints.literals.push(emptyOption);
        };


        // TODO: remove this if not needed
        // Generating a RFC4122 version 4 compliant GUID
        service.generateGUID = function () {
          var d = Date.now();
          var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });
          return guid;
        };

        service.generateTempGUID = function () {
          return "tmp-" + Date.now() + "-" + (window.performance.now() | 0);
        };

        service.elementIsMultiInstance = function (element) {
          return element.hasOwnProperty('minItems') && !angular.isUndefined(element.minItems);
        };

        // Transform string to obtain JSON field name
        service.getFieldName = function (string) {
          // Using Camel case format
          return string.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
          }).replace(/\s+/g, '');

          //// Using underscore format
          //return string
          //  .replace(/'|"|(|)/g, '')
          //  .replace(/ +/g, "_")
          //  .toLowerCase();
        };

        service.getEnumOf = function (fieldName) {
          return UrlService.schemaProperty(fieldName);
        };

        // don't modify the property unless it contains the Cedar schema base url
        // a user might have defined a specific property for this field
        service.getPropertyOf = function (fieldName, property) {
          if (property.indexOf(UrlService.schemaBase()) > -1) {
            return UrlService.schemaProperty(fieldName);
          } else {
            return property;
          }

        };

        service.generateFieldContextProperties = function (fieldName) {
          var c = {};
          c.enum = new Array(service.getEnumOf(fieldName));
          return c;
        };

        service.getAcceptableKey = function (obj, suggestedKey) {
          if (!obj || typeof(obj) != "object") {
            return;
          }

          var key = suggestedKey;
          if (obj[key]) {
            var idx = 1;
            while (obj["" + key + idx]) {
              idx += 1;
            }

            key = "" + key + idx;
          }

          return key;
        };

        service.addKeyToObject = function (obj, key, value) {
          if (!obj || typeof(obj) != "object") {
            return;
          }

          key = service.getAcceptableKey(obj, key);
          obj[key] = value;
          return obj;
        };

        service.renameKeyOfObject = function (obj, currentKey, newKey) {
          if (!obj || !obj[currentKey]) {
            return;
          }

          newKey = service.getAcceptableKey(obj, newKey);
          Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, currentKey));
          delete obj[currentKey];

          return obj;
        };

        service.idOf = function (fieldOrElement) {
          if (fieldOrElement) {
            return service.getFieldSchema(fieldOrElement)['@id'];
          }
        };

        /**
         * Add path for every field in the template
         */
        service.addPathInfo = function (template, path) {
          var properties = $rootScope.propertiesOf(template);
          angular.forEach(properties, function (value, name) {
            if (!DataUtilService.isSpecialKey(name)) {
              // We can tell we've reached an element level by its '@type' property
              if ($rootScope.schemaOf(value)['@type'] == 'https://schema.metadatacenter.org/core/TemplateElement') {
                if (path == null) {
                  service.addPathInfo(value, name);
                }
                else {
                  service.addPathInfo(value, path + '.' + name);
                }
              }
              // If it is a template field
              else {
                // If it is not a static field
                if (!value._ui || !value._ui.inputType || !FieldTypeService.isStaticField(value._ui.inputType)) {

                  var fieldPath = path;
                  if (fieldPath == null || fieldPath.length == 0) {
                    fieldPath = name;
                  }
                  else {
                    fieldPath = fieldPath + '.' + name;
                  }
                  properties[name]['_path'] = fieldPath;
                }
              }
            }
          });
        };


        /**
         * strip tmps for node and children
         * @param node
         */
        service.stripTmps = function (node) {
          service.stripTmpIfPresent(node);

          if (node.type == 'array') {
            node = node.items;
          }

          angular.forEach(node.properties, function (value, key) {
            if (!DataUtilService.isSpecialKey(key)) {
              service.stripTmps(value);
            }
          });
        };

        /**
         * remove the _tmp field from the node and its properties
         * @param node
         */
        service.stripTmpIfPresent = function (node) {

          if (node.hasOwnProperty("_tmp")) {
            delete node._tmp;
          }

          var p = $rootScope.propertiesOf(node);
          if (p && p.hasOwnProperty("_tmp")) {
            delete p._tmp;
          }

        };

        service.createOrder = function (node, order) {

          if (node.hasOwnProperty("@id")) {
            order.push(node['@id']);
          }

          angular.forEach(node.properties, function (value, key) {
            if (!DataUtilService.isSpecialKey(key)) {
              service.createOrder(value, order);
            }
          });
          return order;
        };

        /**
         * Add a field or element name to the top-level 'required' array in a template or element
         * @param {Object} templateOrElement - template or element to which the field will be added
         * @param {String} key - name of the field or element to be added
         */
        service.addKeyToRequired = function (templateOrElement, key) {
          // Initialize schema.required if it's undefined
          if (angular.isUndefined(templateOrElement.required)) {
            templateOrElement.required = [];
          }
          // Check that the key is not already present in the required array
          if (templateOrElement.required.indexOf(key) == -1) {
            templateOrElement.required.push(key);
          }
          return templateOrElement;
        };

        /**
         * Remove a field or element name from the top-level 'required' array in a template or element
         * @param {Object} templateOrElement - template or element
         * @param {String} key - name of the field or element to the removed
         */
        service.removeKeyFromRequired = function (templateOrElement, key) {
          // If the required field is undefined, there is nothing to remove
          if (angular.isUndefined(templateOrElement.required)) {
            return templateOrElement;
          }
          // Remove element from the array
          var index = templateOrElement.required.indexOf(key);
          if (index > -1) {
            templateOrElement.required.splice(index, 1);
          }
          // If the required field is empty, delete it. Empty 'required' fields are not valid in JSON schema
          if (templateOrElement.required.length == 0) {
            delete templateOrElement.required;
          }
          return templateOrElement;
        };

        /**
         * Rename an array item
         * @param {Array} array
         * @param {String} name
         * @param {String} newName
         */
        service.renameItemInArray = function (array, name, newName) {
          var index = array.indexOf(name);
          if (index > -1) {
            array[index] = newName;
          }
          return array;
        };

        /**
         * create domIds for node and children
         * @param node
         */
        service.createDomIds = function (node) {

          service.addDomIdIfNotPresent(node, service.createDomId());

          var prop = $rootScope.propertiesOf(node);
          angular.forEach(prop, function (value, key) {
            if (!DataUtilService.isSpecialKey(key)) {
              service.createDomIds(value);
            }
          });
        };

        /**
         * add a domId to the node if there is not one present
         * @param node
         */
        service.addDomIdIfNotPresent = function (node, id) {

          if (!node.hasOwnProperty("_tmp")) {
            node._tmp = {};
          }
          if (!node._tmp.hasOwnProperty("domId")) {
            node._tmp.domId = id;
          }

          return node._tmp.domId;

        };


        // get the id of the node
        service.getNodeId = function (node) {
          var nodeId = node['@id'] || node.items['@id'];
          return nodeId.substring(nodeId.lastIndexOf('/') + 1);
        };

        service.getId = function (fieldOrElement) {
          return $rootScope.schemaOf(fieldOrElement)['@id'];
        };

        // what is the icon for this field?
        service.getIconClass = function (fieldOrElement) {
          var result = '';
          var fieldType = '';
          var schema = $rootScope.schemaOf(fieldOrElement);
          if (schema._ui.inputType) {
            fieldType = schema._ui.inputType;
            result = FieldTypeService.getFieldIconClass(fieldType);
          }
          return result;
        };

        service.getType = function (fieldOrElement) {
          var schema = $rootScope.schemaOf(fieldOrElement);
          return schema['@type'];
        };

        // Retrieve appropriate input type
        service.getInputType = function (fieldOrElement) {
          //return $rootScope.schemaOf($scope.field)._ui.inputType;
          var inputType = 'element';
          var schema = $rootScope.schemaOf(fieldOrElement);

          if (schema._ui.inputType) {
            inputType = schema._ui.inputType;
          }
          return inputType;
        };

        // is this a checkbox, radio or list question?
        service.isLinkType = function (fieldOrElement) {
          var inputType = service.getInputType(fieldOrElement);
          return (inputType == 'link');
        };

        // is this a checkbox, radio or list question?
        service.isMultiAnswer = function (fieldOrElement) {
          var inputType = service.getInputType(fieldOrElement);
          return ((inputType == 'checkbox') || (inputType == 'radio') || (inputType == 'list'));
        };

        // is this a multiple choice list?
        service.isMultipleChoice = function (fieldOrElement) {
          if ($rootScope.schemaOf(fieldOrElement)._valueConstraints) {
            return $rootScope.schemaOf(fieldOrElement)._valueConstraints.multipleChoice;
          }
        };

        // is this a checkbox, or a multiple choice list field?
        service.isMultipleChoiceField = function (fieldOrElement) {
          var inputType = service.getInputType(fieldOrElement);
          return ((inputType == 'checkbox') || (service.isMultipleChoice(fieldOrElement)));
        };

        // is this a radio, or a sigle-choice ?
        service.isSingleChoiceListField = function (fieldOrElement) {
          var inputType = service.getInputType(fieldOrElement);
          return ((inputType == 'radio') || ((inputType == 'list') && !service.isMultipleChoice(fieldOrElement)));
        };

        // is this a youTube field?
        service.isYouTube = function (field) {
          return field && $rootScope.schemaOf(field)._ui.inputType === 'youtube';
        };

        // is this richText?
        service.isRichText = function (field) {
          return field && $rootScope.schemaOf(field)._ui.inputType === 'richtext';
        };

        // is this an image?
        service.isImage = function (field) {
          return field && $rootScope.schemaOf(field)._ui.inputType === 'image';
        };

        service.getContent = function (fieldOrElement) {
          var schema = $rootScope.schemaOf(fieldOrElement);
          return schema._ui._content;
        };

        service.getSize = function (fieldOrElement) {
          var schema = $rootScope.schemaOf(fieldOrElement);
          return schema._ui._size;
        };

        service.getTitle = function (fieldOrElement) {
          return service.getFieldSchema(fieldOrElement)._ui.title;
        };

        service.getDescription = function (fieldOrElement) {
          return service.getFieldSchema(fieldOrElement)._ui.description;
        };

        service.setSchemaTitle = function (fieldOrElement, value) {
          service.getFieldSchema(fieldOrElement).title = value;
        };

        service.setSchemaDescription = function (fieldOrElement, value) {
          service.getFieldSchema(fieldOrElement).description = value;
        };

        // does this field have a value constraint?
        service.hasValueConstraint = function (fieldOrElement) {
          return $rootScope.hasValueConstraint($rootScope.schemaOf(fieldOrElement)._valueConstraints);
        };

        // get the value constraint literal values
        service.getLiterals = function (fieldOrElement) {
          return $rootScope.schemaOf(fieldOrElement)._valueConstraints.literals;
        };

        // checks if the literal has been set to 'selected by default'
        service.isSelectedByDefault = function (literal) {
          if (literal.selectedByDefault) {
            return true;
          }
          else {
            return false;
          }
        };

        // returns the position of a particular literal in the literals array
        service.indexOfLiteral = function (field, literal) {
          var literals = service.getLiterals(field);
          for (var i = 0; i < literals.length; i++) {
            if (literals[i] == literal) {
              return i;
            }
          }
          return null;
        };

        // service.nextSibling = function (field, parent, parentKey) {
        //   console.log('nextSibling ' )
        //
        //   if (field && parent && key) {
        //
        //     var id = service.getFieldSchema(field)["@id"];
        //     var props = service.getFieldSchema(parent).properties;
        //     var order = service.getFieldSchema(parent)._ui.order;
        //     var selectedKey;
        //
        //
        //     angular.forEach(props, function (value, key) {
        //       var valueId = service.getFieldSchema(value)["@id"];
        //       if (valueId) {
        //         if (service.getFieldSchema(value)["@id"] == id) {
        //           selectedKey = key;
        //         }
        //       }
        //     });
        //
        //     console.log('nextSibling ' + selectedKey);
        //
        //
        //     if (selectedKey) {
        //       var idx = order.indexOf(selectedKey);
        //       idx += 1;
        //       var found = false;
        //       while (idx < order.length && !found) {
        //         var nextKey = order[idx];
        //         var next = props[nextKey];
        //         found = !service.isStaticField(next);
        //         idx += 1;
        //       }
        //       if (found) {
        //         console.log('found ' + nextKey);
        //         return next;
        //       } else {
        //         console.log('not found');
        //
        //       }
        //     }
        //   }
        // };

        // get the locator for the node's dom object
        service.getLocator = function (node, index, path, id) {
          return 'dom-' + id + '-' + (path || 0).toString() + '-' + (index || 0).toString();
        };

        // look to see if this node has been identified by angular as an invalid pattern
        service.isValidPattern = function (node, index, path, id) {
          var locator = service.getLocator(node, index, path, id) + '.ng-invalid';
          var target = jQuery('#' + locator);
          return (target.length == 0);
        };

        // get the value of the dom object for this node
        service.getDomValue = function (node, index, path, id) {
          var result;
          var locator = service.getLocator(node, index, path, id);
          var target = jQuery('#' + locator);
          if (target.length > 0) {
            result = target[0].value;
          }
          return result;
        };


        /**
         * add a domId to the node if there is not one present
         * @param node
         */
        service.defaultTitle = function (node) {

          node._ui.title = $translate.instant("GENERIC.Untitled");

        };

        /**
         * get the domId of the node if there is one present
         * @param node
         */
        service.getDomId = function (node) {
          var domId = null;
          if (node && node.hasOwnProperty("_tmp")) {
            domId = node._tmp.domId;
          };
          return domId;
        };

        service.newGetDomId = function (node) {


          var domId = null;

          if (node.hasOwnProperty("_tmp")) {
            domId = node._tmp.domId;
          }

          return domId;
        };


        /**
         * make a unique string that we can use for dom ids
         */
        service.createDomId = function () {
          return 'id' + Math.random().toString().replace(/\./g, '');
        };


        /**
         * get the controlled terms list for field types
         * @returns {Array}
         */
        service.getFieldControlledTerms = function (node) {

          var properties = service.getFieldProperties(node);
          if (properties['@type'].oneOf && properties['@type'].oneOf[1]) {
            return properties['@type'].oneOf[1].items['enum'];
          }
          else {
            return null;
          }
        };

        /**
         * parse the ontology code from the source
         * @param itemData
         * @returns {*}
         */
        service.parseOntologyCode = function (itemData) {
          var re = new RegExp('\((.+)\)');
          var m;
          var result;
          if ((m = re.exec(itemData)) !== null) {
            if (m.index === re.lastIndex) {
              re.lastIndex++;
            }
            result = m[1];
          }
          return result;
        };

        /**
         * parse the class from the selfUrl
         * @param itemData
         * @returns {*}
         */
        service.parseClassLabel = function (itemData) {
          var re = new RegExp('\/classes\/(.+)');
          var m;
          var result;
          if ((m = re.exec(itemData)) !== null) {
            if (m.index === re.lastIndex) {
              re.lastIndex++;
            }
            result = m[1];
          }
          // Decode the class URI
          result = decodeURIComponent(result);
          return result;
        };


        /**
         * parse the ontology code from the selfUrl
         * @param itemData
         * @returns {*}
         */
        service.parseOntologyName = function (itemData) {
          var re = new RegExp('\/ontologies\/(.+)\/classes\/');
          var m;
          var result;
          if ((m = re.exec(itemData)) !== null) {
            if (m.index === re.lastIndex) {
              re.lastIndex++;
            }
            result = m[1];
          }
          return result;
        };

        /**
         * delete both the oneOf copies of the class id for the question type
         * @param itemDataId
         */
        service.deleteFieldControlledTerm = function (itemDataId, node) {
          var properties = service.getFieldProperties(node);
          var idx = properties["@type"].oneOf[0].enum.indexOf(itemDataId);

          if (idx >= 0) {
            properties["@type"].oneOf[0].enum.splice(idx, 1);
            if (properties["@type"].oneOf[0].enum.length == 0) {
              delete properties["@type"].oneOf[0].enum;
            }
          }

          idx = properties['@type'].oneOf[1].items.enum.indexOf(itemDataId);

          if (idx >= 0) {
            properties['@type'].oneOf[1].items.enum.splice(idx, 1);
            if (properties["@type"].oneOf[1].items.enum.length == 0) {
              delete properties["@type"].oneOf[1].items.enum;
            }
          }
          service.initializeSchema(node);
        };

        /**
         * delete the branch in valueConstraints
         * @param branch
         */
        service.deleteFieldAddedBranch = function (branch, node) {

          var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
          for (var i = 0, len = valueConstraints.branches.length; i < len; i += 1) {
            if (valueConstraints.branches[i]['uri'] == branch['uri']) {
              valueConstraints.branches.splice(i, 1);
              break;
            }
          }
          service.initializeSchema(node);
        };

        /**
         * delete the ontologyCLass in valueConstraints
         * @param ontologyClass
         */
        service.deleteFieldAddedClass = function (ontologyClass, node) {

          var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
          for (var i = 0, len = valueConstraints.classes.length; i < len; i += 1) {
            if (valueConstraints.classes[i] == ontologyClass) {
              valueConstraints.classes.splice(i, 1);
              break;
            }
          }
          service.initializeSchema(node);
        };


        /**
         * delete the ontology in valueConstraints
         * @param ontology
         */
        service.deleteFieldAddedOntology = function (ontology, node) {

          var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
          for (var i = 0, len = valueConstraints.ontologies.length; i < len; i += 1) {
            if (valueConstraints.ontologies[i]['uri'] == ontology['uri']) {
              valueConstraints.ontologies.splice(i, 1);
              break;
            }
          }
          service.initializeSchema(node);
        };

        /**
         * delete the valueSet in valueConstraints
         * @param valueSet
         */
        service.deleteFieldAddedValueSet = function (valueSet, node) {

          var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
          for (var i = 0, len = valueConstraints.valueSets.length; i < len; i += 1) {
            if (valueConstraints.valueSets[i]['uri'] == valueSet['uri']) {
              valueConstraints.valueSets.splice(i, 1);
              break;
            }
          }
          service.initializeSchema(node);
        };

        // deselect any current selected items, then select this one
        service.canSelect = function (field) {
          var result = true;
          if (!service.isEditState(field)) {
            if ($rootScope.selectedFieldOrElement && service.isEditState($rootScope.selectedFieldOrElement)) {
              result = service.canDeselect($rootScope.selectedFieldOrElement);
            }
            if (result) service.setSelected(field);
          }
          return result;
        };

        // When user clicks Save button, we will switch field or element from creating state to completed state
        service.canDeselect = function (field, renameChildKey) {

          if (!field) {
            return;
          }

          service.setMinMax(field);
          service.setDefaults(field);

          var errorMessages = jQuery.merge(service.checkFieldConditions(field),
              ClientSideValidationService.checkFieldCardinalityOptions(field));

          // don't continue with errors
          if (errorMessages.length == 0) {
            delete $rootScope.propertiesOf(field)._tmp;

            if (renameChildKey) {
              var key = service.getFieldName(service.getFieldSchema(field)._ui.title);
              renameChildKey(field, key);
            }

            var event = service.isElement(field) ? "invalidElementState" : "invalidFieldState";
            $rootScope.$emit(event,
                ["remove", $rootScope.schemaOf(field)._ui.title, field["@id"]]);
          }

          $rootScope.$broadcast("deselect", [field, errorMessages]);

          return errorMessages.length == 0;
        };

        var MIN_OPTIONS = 2;
        service.setDefaults = function (field) {
          var schema = $rootScope.schemaOf(field);

          // default title
          if (!schema._ui.title || !schema._ui.title.length) {
            schema._ui.title = $translate.instant("GENERIC.Untitled");
          }

          // default description
          //if (!schema._ui.description || !schema._ui.description.length) {
          //  schema._ui.description = $translate.instant("GENERIC.Description");
          //}

          // if this is radio, checkbox or list,  add at least two options and set default values
          if (schema._ui.inputType == "radio" || schema._ui.inputType == "checkbox" || schema._ui.inputType == "list") {

            // make sure we have the minimum number of options
            while (schema._valueConstraints.literals.length < MIN_OPTIONS) {
              var emptyOption = {
                "label": name || ""
              };
              schema._valueConstraints.literals.push(emptyOption);
            }

            // and they all have text fields filled in
            for (var i = 0; i < schema._valueConstraints.literals.length; i++) {
              if (schema._valueConstraints.literals[i].label.length == 0) {
                schema._valueConstraints.literals[i].label = $translate.instant("VALIDATION.noNameField") + "-" + i;
              }
            }
          }
        };

        // look for errors in field or element
        service.checkFieldConditions = function (field) {
          var schema = $rootScope.schemaOf(field);

          var unmetConditions = [],
              extraConditionInputs = ['checkbox', 'radio', 'list'];

          // Field title is required, if it's empty create error message
          if (!schema._ui.title) {
            unmetConditions.push('"Enter Title" input cannot be left empty.');
          }

          // If field is within multiple choice field types
          if (extraConditionInputs.indexOf(schema._ui.inputType) !== -1) {
            var optionMessage = '"Enter Option" input cannot be left empty.';
            angular.forEach(schema._valueConstraints.literals, function (value, index) {
              // If any 'option' title text is left empty, create error message
              if (!value.label.length && unmetConditions.indexOf(optionMessage) == -1) {
                unmetConditions.push(optionMessage);
              }
            });
          }
          // If field type is 'radio' or 'pick from a list' there must be more than one option created
          if ((schema._ui.inputType == 'radio' || schema._ui.inputType == 'list') && schema._valueConstraints.literals && (schema._valueConstraints.literals.length <= 1)) {
            unmetConditions.push('Multiple Choice fields must have at least two possible options');
          }
          // Return array of error messages
          return unmetConditions;
        };

        service.isElement = function (value) {
          if (value && value['@type'] && value['@type'] == "https://schema.metadatacenter.org/core/TemplateElement") {
            return true;
          }
          else {
            return false;
          }
        };

        // get the property out of the form for this node
        service.getProperty = function (form, node) {
          var id = service.getId(node);
          var result = '';

          var props = $rootScope.propertiesOf(form);
          for (var prop in props) {
            if ($rootScope.schemaOf(props[prop])['@id'] === id) {

              // only return non-cedar property values
              var property = form.properties['@context'].properties[prop]['enum'][0];
              if (property.indexOf(UrlService.schemaProperties()) == -1) {
                result = property;
              }
              break;
            }
          }
          return result;
        };

        // delete the property from the form for this node
        service.deleteProperty = function (form, node) {
          var id = service.getId(node);
          var props = $rootScope.propertiesOf(form);
          for (var prop in props) {
            if ($rootScope.schemaOf(props[prop])['@id'] === id) {
              form.properties['@context'].properties[prop]['enum'][0] = service.getEnumOf(prop);
              break;
            }
          }
        };

        // relabel the key with a new value from the propertyLabels
        service.relabel = function (node, key) {

          var schema = $rootScope.schemaOf(node);
          var p = $rootScope.propertiesOf(node);

          // make sure label is not empty
          if (schema._ui.propertyLabels[key].length == 0) {
            schema._ui.propertyLabels[key] = 'default';
          }

          var newLabel = schema._ui.propertyLabels[key];
          var newKey = service.getFieldName(newLabel);
          newKey = service.getAcceptableKey(p, newKey);

          // update propertyLabels
          delete schema._ui.propertyLabels[key];
          schema._ui.propertyLabels[newKey] = newLabel;

          var child = p[key];
          var childId = service.idOf(child);

          angular.forEach(p, function (value, k) {
            if (!value) {
              return;
            }

            //var idOfValue = service.idOf(value);
            //if (idOfValue && idOfValue == childId) {
            if (key == k) {

              service.renameKeyOfObject(p, key, newKey);

              if (p["@context"] && p["@context"].properties) {
                service.renameKeyOfObject(p["@context"].properties, key, newKey);

                // update enum only if it is using one of our made up property URIs
                var prop = p["@context"].properties[newKey];
                if (prop && prop.enum) {
                  if (prop.enum[0].indexOf(UrlService.schemaProperties()) > -1) {
                    prop.enum[0] = service.getEnumOf(newKey);
                  }
                }
              }

              if (p["@context"].required) {
                var idx = p["@context"].required.indexOf(key);
                p["@context"].required[idx] = newKey;
              }

              // Rename key in the 'order' array
              schema._ui.order = service.renameItemInArray(schema._ui.order, key, newKey);

              // Rename key in the 'required' array
              schema.required = service.renameItemInArray(schema.required, key, newKey);

            }
          });
        };

        return service;
      }
      ;

    }
);
