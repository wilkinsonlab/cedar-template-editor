'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.profile.privacyController', [])
      .controller('PrivacyController', PrivacyController);

  PrivacyController.$inject = ["$rootScope", "$scope", "UrlService", "HeaderService", "UserService", "CONST"];

  function PrivacyController($rootScope, $scope, UrlService, HeaderService, UserService, CONST) {

    console.log('privacy controller');

    $rootScope.pageTitle = 'Privacy';
    $rootScope.documentTitle = 'Privacy';

    // Inject constants
    $scope.CONST = CONST;

    var pageId = CONST.pageId.PRIVACY;
    HeaderService.configure(pageId);

    $scope.getTokenValidity = function () {
      return UserService.getTokenValiditySeconds();
    }

    $scope.urlService = UrlService;
  };

});
