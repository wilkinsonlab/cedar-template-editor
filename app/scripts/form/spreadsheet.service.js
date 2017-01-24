'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.form.spreadsheetService', [])
      .service('SpreadsheetService', SpreadsheetService);

  SpreadsheetService.$inject = ['$rootScope', '$filter'];

  function SpreadsheetService($rootScope, $filter) {
    return {
      serviceId: "SpreadsheetService",

      validators: {
        email: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
      },

      customRenderer: {
        checkboxes: function (instance, td, row, col, prop, value, cellProperties) {
          var objValue = JSON.parse(value);
          var s = "";
          var sep = "";
          for (var name in objValue) {
            if (objValue[name]) {
              s += sep + name;
              sep = ", ";
            }
          }
          var escaped = Handsontable.helper.stringify(s);
          td.innerHTML = escaped;
          return td;
        },
        deepObject: function (instance, td, row, col, prop, value, cellProperties) {
          var s = value + '<i class="cedar-svg-element inSpreadsheetCell"></i>';
          var escaped = Handsontable.helper.stringify(s);
          td.innerHTML = escaped;
          td.className = 'htDimmed';
          return td;
        }
      },

      updateDataModel: function ($scope) {
        var sds = $scope.spreadsheetDataScope;
        for (var row in sds.tableData) {
          for (var col in sds.tableData[row]) {
            var inputType = sds.columnDescriptors[col].type;
            var cedarType = sds.columnDescriptors[col].cedarType;
            if (inputType == 'dropdown') {
              var containerArray = [];
              containerArray.push(sds.tableData[row][col]);
              sds.tableDataSource[row][col]['@value'] = containerArray;
            } else if (cedarType == 'checkboxes') {
              var valueObject = JSON.parse(sds.tableData[row][col]);
              var value = {};
              for (var key in valueObject) {
                value[key] = true;
              }
              sds.tableDataSource[row][col]['@value'] = value;
            } else {
              sds.tableDataSource[row][col]['@value'] = sds.tableData[row][col];
            }
          }
        }
      },

      getMinItems: function (scopeElement) {
        var minItems = 0;
        if (scopeElement.hasOwnProperty("minItems")) {
          minItems = scopeElement.minItems;
        }
        return minItems;
      },

      getMaxItems: function (scopeElement) {
        var maxItems = Number.POSITIVE_INFINITY;
        if (scopeElement.hasOwnProperty("maxItems")) {
          maxItems = scopeElement.maxItems;
        }
        return maxItems;
      },

      getColumnHeaderOrder: function (context, scopeElement) {
        var headerOrder = [];
        if (context.isField()) {
          headerOrder.push('value');
        } else {
          var itemOrder = $rootScope.schemaOf(scopeElement)._ui.order;
          for (var i in itemOrder) {
            headerOrder.push(itemOrder[i]);
          }
        }
        return headerOrder;
      },

      extractOptionsForList: function (options) {
        var list = [];
        for (var i in options) {
          list.push(options[i].label);
        }
        return list;
      },

      extractOptionsForCheckboxes: function (options) {
        var list = [];
        for (var i in options) {
          list.push(options[i].label);
        }
        return list;
      },

      getColumnDescriptors: function (context, scopeElement, columnHeaderOrder, originalScope) {
        var colDescriptors = [];

        for (var i in columnHeaderOrder) {
          var desc = {};
          desc.type = 'text';
          desc.cedarType = null;
          var name = columnHeaderOrder[i];
          var field = null;

          if (context.isField()) {
            field = scopeElement;
          } else {
            field = scopeElement;
          }

          if (field.hasOwnProperty("items")) {

            var items = field.items;
            if (items != null && items.hasOwnProperty('properties')) {

              var _ui = field.items._ui;
              var inputType = _ui.inputType;

              if (inputType == 'date') {
                // http://docs.handsontable.com/0.19.0/demo-date.html
                desc.type = 'date';
                desc.dateFormat = 'MM/DD/YYYY HH:mm';
                desc.correctFormat = true;
              } else if (inputType == 'email') {
                // http://docs.handsontable.com/0.19.0/demo-data-validation.html
                desc.allowInvalid = true;
                desc.validator = this.validators.email;
              } else if (inputType == 'numeric') {
                // http://docs.handsontable.com/0.19.0/demo-numeric.html
                // http://numeraljs.com/
                desc.type = 'numeric';
              } else if (inputType == 'list') {
                if (_valueConstraints.multipleChoice == false) {
                  desc.type = 'dropdown';
                  var listOptions = this.extractOptionsForList(_valueConstraints.literals);
                  desc.source = listOptions;
                }
              } else if (inputType == 'checkbox') {
                desc.renderer = this.customRenderer.checkboxes;
                desc.editor = 'checkboxes';//MultiCheckboxEditor;
                var checkboxOptions = this.extractOptionsForCheckboxes(_valueConstraints.literals);
                desc.source = checkboxOptions;
                desc.cedarType = 'checkboxes';
              }
            } else {
              desc.cedarType = 'deepObject';
              desc.cedarLabel = $filter('keyToTitle')(name);
              desc.readOnly = true;
              desc.renderer = this.customRenderer.deepObject;
            }

            colDescriptors.push(desc);
          }
        }
        console.log(colDescriptors);
        return colDescriptors;
      },

      extractAndStoreCellData: function (cellDataObject, rowData, columnDescriptor) {
        var inputType = columnDescriptor.type;
        var cedarType = columnDescriptor.cedarType;
        if (inputType == 'dropdown') {
          rowData.push(cellDataObject['@value'][0]);
        } else if (cedarType == 'checkboxes') {
          rowData.push(JSON.stringify(cellDataObject['@value']));
        } else if (cedarType == 'deepObject') {
          rowData.push(columnDescriptor.cedarLabel);
        } else {
          rowData.push(cellDataObject._valueLabel || cellDataObject['@value']);
        }
      },

      getTableData: function (context, $scope, headerOrder, columnDescriptors) {
        var tableData = [];
        for (var i in $scope.model) {
          var row = $scope.model[i];
          var rowData = [];
          if (context.isField()) {
            this.extractAndStoreCellData(row, rowData, columnDescriptors[0]);
          } else {
            for (var col in headerOrder) {
              var colName = headerOrder[col];
              var cellDataObject = row[colName];
              this.extractAndStoreCellData(cellDataObject, rowData, columnDescriptors[col]);
            }
          }
          tableData.push(rowData);
        }
        return tableData;
      },

      getTableDataSource: function (context, $scope, headerOrder) {
        var tableDataSource = [];
        for (var i in $scope.model) {
          var row = $scope.model[i];
          var rowDataSource = [];
          if (context.isField()) {
            rowDataSource.push(row);
          } else {
            for (var col in headerOrder) {
              var colName = headerOrder[col];
              var cellDataObject = row[colName];
              rowDataSource.push(cellDataObject);
            }
          }
          tableDataSource.push(rowDataSource);
        }
        return tableDataSource;
      },

      switchToSpreadsheetField: function ($scope, $element) {
        console.log("Switch to spreadsheet on FIELD");
        console.log($scope);
        console.log($element);
        var context = new SpreadsheetContext("field", $element);
        this.switchToSpreadsheet(context, $scope, $element);
      },

      switchToSpreadsheetElement: function ($scope, $element) {
        console.log("Switch to spreadsheet on ELEMENT");
        console.log($scope);
        console.log($element);
        var context = new SpreadsheetContext("element", $element);
        this.switchToSpreadsheet(context, $scope, $element);
      },

      applyVisibility: function ($scope) {
        var context = $scope.spreadsheetContext;
        var ov = context.isOriginalContentVisible();
        jQuery(context.getOriginalContentContainer()).toggleClass("visible", ov);
        jQuery(context.getOriginalContentContainer()).toggleClass("hidden", !ov);
        jQuery(context.getSpreadsheetContainer()).toggleClass("visible", !ov);
        //var elementDirective = jQuery(context.getSpreadsheetContainer()).parent().parent();
        //jQuery(".spreadsheetSwitch.element.spreadsheet", elementDirective).toggleClass("visible", !ov);

      },

      switchToSpreadsheet: function (ctx, $scope, $element) {
        console.log('switchToSpreadsheet');
        var context = ctx;
        if ($scope.hasOwnProperty('spreadsheetContext')) {
          console.log('hasOwnProperty');
          context = $scope.spreadsheetContext;
          context.switchVisibility();
          if (context.isOriginalContentVisible()) {
            console.log('already visible');
            context.getTable().destroy();
            jQuery(context.getSpreadsheetContainer()).html("");
            console.log('apply visibility to existing container')
            this.applyVisibility($scope);
            return;
          } else {
            console.log('switchvisibility');
            context.switchVisibility();
          }
        } else {
          $scope.spreadsheetContext = context;
        }

        var owner = this;
        console.log($scope);
        var scopeElement = (context.isField() ? $scope.field : $scope.element);
        console.log("scopeElement:");
        console.log(scopeElement);
        console.log(context);


        // handsOnTable config object
        var hotConfig = {};

        // column names
        var columnHeaderOrder = this.getColumnHeaderOrder(context, scopeElement);

        // column descriptors (type, constraint, ...)
        var columnDescriptors = this.getColumnDescriptors(context, scopeElement, columnHeaderOrder, $scope);
        hotConfig.columns = columnDescriptors;

        // min and max rows
        hotConfig.minRows = this.getMinItems(scopeElement);
        hotConfig.maxRows = this.getMaxItems(scopeElement);

        // table data
        var tableData = this.getTableData(context, $scope, columnHeaderOrder, columnDescriptors);
        hotConfig.data = tableData;

        var tableDataSource = this.getTableDataSource(context, $scope, columnHeaderOrder);


        // static config
        //hotConfig.height = 200;
        hotConfig.rowHeaders = true;
        hotConfig.stretchH = 'all';
        hotConfig.trimWhitespace = false;
        hotConfig.manualRowResize = true;

        var colHeaders = [];
        for (var i in columnHeaderOrder) {
          colHeaders.push($filter('keyToTitle')(columnHeaderOrder[i]));
        }
        hotConfig.colHeaders = colHeaders;

       console.log(hotConfig);

        // DOM detector element
        var detectorElement = angular.element('.spreadsheetViewDetector', context.getPlaceholderContext());
        // DOM element that contains the part to be replaced with HOT
        var container = angular.element('.spreadsheetViewContainer', context.getPlaceholderContext())[0];
        console.log(container);
        context.setSpreadsheetContainer(container);



        // Compute size based on available width and number of rows
        var spreadsheetRowCount = tableData.length;
        var spreadsheetContainerHeight = 30 + spreadsheetRowCount * 30 + 20;
        var spreadsheetContainerWidth = detectorElement.width() - 5;
        //console.log("HEIGHT:" + spreadsheetContainerHeight);

        angular.element(container).css("height", spreadsheetContainerHeight + "px");
        angular.element(container).css("width", spreadsheetContainerWidth + "px");
        context.setOriginalContentContainer(angular.element('.originalContent', context.getPlaceholderContext())[0]);
        context.switchVisibility();
        this.applyVisibility($scope);

        console.log(context);


        // launch hot
        var hot = new Handsontable(container, hotConfig);

        // push data to scope
        $scope.spreadsheetDataScope = {
          tableData        : tableData,
          tableDataSource  : tableDataSource,
          columnDescriptors: columnDescriptors
        };

        hot.addHook('afterChange', function () {
          console.log("After change");
          owner.updateDataModel($scope, $element);
        });

        context.setTable(hot);


      }
    };
  };

});
