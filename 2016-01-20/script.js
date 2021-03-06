angular.module('test', ['appConfig'])
  .value('moment', window.moment)

  .controller('TestController', ['$scope', '$rootScope', function($scope, $rootScope) {
    $scope.value = 'Test';
  }])
  .controller('ListController', ['$scope', 'storageService', function($scope, storageService) {

    this.names = storageService.load();
    this.down = function (index) {
      var temp = this.names[index];
      this.names[index] = this.names[index + 1];
      this.names[index + 1] = temp;
      $scope.$emit('orderchanged', this.names);
    };

    this.up = function (index) {
      var temp = this.names[index];
      this.names[index] = this.names[index - 1];
      this.names[index - 1] = temp;
      $scope.$emit('orderchanged', this.names);
    };

    
  }])
  .config(['companyName', 'storageServiceProvider', function(companyName, storageServiceProvider) {
    storageServiceProvider.setKey(companyName);
  }])
  .controller('PopupController', function ($scope, data, otherData) {
    this.controllerWorks = 'IT WORKS';
    this.data = data;
    this.otherData = otherData;
  })
  .run(['$rootScope', 'companyName', 'storageService', 'modalService', function($rootScope, companyName, storageService, modalService) {
    $rootScope.companyName = companyName;
    $rootScope.unsaved = false;
    
    $rootScope.showPopup = function () {
      modalService({
        templateUrl: 'partial.html',
        controller: 'PopupController as popup',
        resolve: {
          data: function($q) { return $q.when('TEST') },
          otherData: function($q) { return $q.when('TEST2') }
        }
      });
    }
    
    $rootScope.$on('orderchanged', function (e, names) {
      storageService.save(names);
      
    });  
  }])
  ;

/*
value
constant
service
factory
provider
*/