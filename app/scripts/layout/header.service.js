'use strict';

define([
  'angular',
  'json!config/header-service.conf.json'
], function(angular, config) {
  angular.module('cedar.templateEditor.layout.headerService', [])
    .service('HeaderService', HeaderService);

  HeaderService.$inject = ["$rootScope"];

  function HeaderService($rootScope) {
    
    var service = {
      serviceId: "HeaderService",

      miniHeaderEnabled    : false,
      miniHeaderScrollLimit: NaN,
      dataContainer        : {
        currentObjectScope: null
      }
    };
        
    service.configure = function (pageId) {
      this.miniHeaderEnabled = config[pageId].enabled;
      this.miniHeaderScrollLimit = config[pageId].scrollLimit;
      $rootScope.pageId = pageId;
    };
    
    service.isEnabled = function () {
      return this.miniHeaderEnabled;
    };
    
    service.getScrollLimit = function () {
    return this.miniHeaderScrollLimit;
    };

    service.getScrollSelector = function () {
      return this.miniHeaderScrollSelector;
    };
    
    service.getStickyThreshold = function () {
      return config.stickyThreshold;
    };

    service.getScrollSelector = function () {
      return config.scrollSelector;
    };
    
    service.showMini = function (pageYOffset) {
      return this.isEnabled() && pageYOffset > this.getScrollLimit();
    };
    
    return service;
  };
  
});