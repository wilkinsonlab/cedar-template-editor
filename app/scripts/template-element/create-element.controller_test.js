'use strict';

define(['app', 'angularMocks'], function(app) {
  describe('create-element.controller_test.js', function() {
    beforeEach(module('cedar.templateEditor'));

    var $controller;
    var $rootScope;

    beforeEach(inject(function(_$rootScope_, _$controller_) {
      // The injector unwraps the underscores (_) from around the parameter names when matching
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    }));

    describe('CreateElementController', function() {
      it('sets the pageTitle to "Element Designer"', function() {
        var $scope = $rootScope.$new();
        var controller = $controller('CreateElementController', { $scope: $scope });
        expect($scope.pageTitle).toEqual('Element Designer');
      });
    });
  });
});