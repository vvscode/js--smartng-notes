angular.module('test')
  .directive('size', function () {
    return {
      restrict: 'E',
      template: 'My size is {{width}}x{{height}}',
      controller: function ($scope, $window) {
        function resizeListener () {
          $scope.$applyAsync(() => {
            $scope.width = $window.outerWidth;
            $scope.height = $window.outerHeight;
          });
        };

        $window.addEventListener('resize', resizeListener);
        resizeListener();
      }
    }
  })
;