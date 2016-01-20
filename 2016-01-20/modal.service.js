angular.module('test')
  .value('lodash', window._)
  .directive('modalContainer', function () {
    return {
      restrict: 'E',
      transclude: true,
      template: [
        '<div class="modal">',
          '<div class="modalContent" ng-transclude>',
          '</div>',
        '</div>'
      ].join('')
    }
  })
  .factory('modalService', function ($q, $injector, lodash, $templateRequest, $controller, $rootScope, $compile, $window) {
    return function (config) {
      
      var resolve = config.resolve || {};
      
      resolve.$$template = function() {
        return (config.template) ? $q.when(config.template) : $templateRequest(config.templateUrl)
      };
      
      
      $q.all(lodash.mapValues(resolve, $injector.invoke)).then(function (resolves) {
        var controller = config.controller || angular.noop;
        var scope = $rootScope.$new();
        var template = $compile('<modal-container>' + resolves.$$template + '</modal-container>');
        delete resolves.$$template;
        console.log(lodash.assign({
          $scope: scope
        }, resolves));
        $controller(controller, lodash.assign({
          $scope: scope
        }, resolves));
        console.log(scope);
        var element = template(scope);
        angular.element($window.document.body).append(element);
        
      })
    }  
  });

