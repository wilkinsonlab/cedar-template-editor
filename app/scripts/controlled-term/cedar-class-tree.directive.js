'use strict';

define([
  'angular'
], function(angular) {
  angular.module('cedar.templateEditor.controlledTerm.cedarClassTreeDirective', [])
    .directive('cedarClassTree', cedarClassTreeDirective);

  cedarClassTreeDirective.$inject = ['$timeout'];

  /**
   * This 'cedarClassTree' directive will call the 'childTree' directive for 
   * every child in the collection returned from the controlledTermDataService.
   */
  function cedarClassTreeDirective($timeout) {
    var directive = {
      restrict: 'E',
      scope: {
        getClassDetailsCallback: '=', // why won't this work with & ?
        tree: '=',
        term: '=',
        level: '=',
        selectedNode: '=',
        isSelectedCallback: '='  // why won't this work with & ?
      },
      templateUrl: 'scripts/controlled-term/cedar-class-tree.directive.html',
      replace: true,
      link: linker
    };

    return directive;

    function linker(scope, element, attrs) {
      $timeout(function() {
        if (scope.selectedNode) {
          var id = scope.selectedNode["@id"];
          var node = angular.element("[at_id='" + id + "']");

          if (node.length > 0) {
            var $container = element.parent();
            var containerHeight = $container.height();
            var containerWidth = $container.width();
            var containerOffset = $container.offset();
            var selectedNodeOffset = node.offset();

            var topScrollAmount = selectedNodeOffset.top - containerOffset.top - containerHeight/2;
            var leftScrollAmount = selectedNodeOffset.left - containerOffset.left - containerWidth/2;

            if (topScrollAmount > 0) {
              $container.scrollTop(topScrollAmount);
            }

            if (leftScrollAmount > 0) {
              $container.scrollLeft(leftScrollAmount);
            }
          }
        }
      });
    }
  }

});