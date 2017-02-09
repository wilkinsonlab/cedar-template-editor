'use strict';

define([
  'angular',
], function (angular) {
  angular.module('cedar.templateEditor.service.queryParamUtilsService', [])
      .service('QueryParamUtilsService', QueryParamUtilsService);

  QueryParamUtilsService.$inject = ['$location'];

  function QueryParamUtilsService($location) {

    var service = {
      serviceId: "QueryParamUtilsService"
    };

    service.init = function () {
      // Code to initialize service
    };

    service.getFolderId = function () {
      return service.getQueryParameter("folderId");
    }

    service.folderId = function (id) {
      if (id) {
        $location.search().folderId = id;
      }
      return service.getQueryParameter("folderId");
    };

    service.resourceId = function (id) {
      if (id) {
        $location.search().resourceId = id;
      }
      return service.getQueryParameter("resourceId");
    };

    service.getQueryParameter = function(parameterName) {
      var params = $location.search();
      return params[parameterName];
    }

    return service;
  };

});
