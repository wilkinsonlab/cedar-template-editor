'use strict';


define([
  'angular'
], function(angular) {
  angular.module('cedar.templateEditor.service.dataUtilService', [])
    .service('DataUtilService', DataUtilService);

  DataUtilService.$inject = ["$rootScope"];

  function DataUtilService($rootScope) {

    var specialKeyPattern = /(^@)|(^_)|(^schema:)|(^pav:)|(^oslc:)/i;

    var service = {
      serviceId: "DataUtilService"
    };

    // Return true if testScope.properties object only contains default values
    service.isPropertiesEmpty = function (testScope) {
      if (!angular.isUndefined(testScope) && testScope.properties) {
        var keys = Object.keys(testScope.properties);
        for (var i = 0; i < keys.length; i++) {
          if (!this.isSpecialKey(keys[i])) {
            return false;
          }
        }
        return true;
      }
    };

    // Return true if the key is of json-ld type '@' or if it corresponds to any of the reserved fields
    service.isSpecialKey = function (key) {
      return specialKeyPattern.test(key);
    };

    return service;
  };

});
