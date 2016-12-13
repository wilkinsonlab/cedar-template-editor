'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.form.lincsDirective', [])
    .directive('lincs', lincsDirective);

  lincsDirective.$inject = ['$http'];

  function lincsDirective($http) {

    return {
      restrict: 'A',
      require: 'ngModel',

      link: function (scope, element, attr, ctrl) {

        function lincsValidator(ngModelValue) {

          scope.$watch('lincs.name', function (newValue, oldValue) {
            if (newValue != oldValue) {
              console.log("\nName changed: " + oldValue + " -> " + newValue);
              validateName(newValue);
            }
          });

          scope.$watch('lincs.cid', function (newValue, oldValue) {
            if (newValue != oldValue) {
              console.log("\nCID changed: " + oldValue + " -> " + newValue);
              validateCid(newValue);
            }
          });

          scope.$watch('lincs.smiles', function (newValue, oldValue) {
            if (newValue != oldValue) {
              console.log("\nSMILES changed: " + oldValue + " -> " + newValue);
              validateSmiles(newValue);
            }
          });
          return ngModelValue;
        }

        function validateName(name) {
          isValidName(name)
            .then(function() {
              console.log("name is valid");
              ctrl.$setValidity('lincs', true);
            }, function() {
              console.log("name is invalid");
              ctrl.$setValidity('lincs', false);
            });
        }

        function isValidName(name) {
          console.log("Checking if name '" + name + "' is valid");
          var url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + name + '/synonyms/JSON';
          return $http.get(url);
        }


        function validateCid(cid) {
          isValidCid(cid)
            .then(function() {
              console.log("cid is valid");
              ctrl.$setValidity('lincs', true);
            }, function() {
              console.log("cid is invalid");
              ctrl.$setValidity('lincs', false);
            });
        }

        function isValidCid(cid) {
          console.log("Checking if cid '" + cid + "' is valid");
          var url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/' + cid + '/JSON';
          return $http.get(url);
        }


        function validateSmiles(smiles) {
          isValidSmiles(smiles)
            .then(function() {
              console.log("smiles is valid");
              ctrl.$setValidity('lincs', true);
            }, function() {
              console.log("smiles is invalid");
              ctrl.$setValidity('lincs', false);
            });
        }

        function isValidSmiles(smiles) {
          console.log("Checking if smiles '" + smiles + "' is valid");
          var url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/record/JSON?Content-Type:%20application/x-www-form-urlencoded&smiles=' + encodeURIComponent(smiles);
          return $http.get(url);
        }

        // add custom validator
        ctrl.$parsers.push(lincsValidator);
      }
    };
  }
});