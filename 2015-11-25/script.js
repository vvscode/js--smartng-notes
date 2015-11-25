(function() {
  'use strict';

  angular
    .module('smartjs')
    .factory('loadService', ['$http', '$rootScope', '$timeout', function($http, $rootScope, $timeout) {
      var data = [];

      function findById(id) {
        for(var i = 0; i< data.length; i++) {
          if(data[i].id == id) {
            return data[i];
          }
        }
      }

      function updateDataList(records, fromVersion, toVersion) {
        var correctVersion = !!toVersion && (!data.version || data.version === fromVersion);
        records = records || [];
        if(correctVersion) {
          data.version = toVersion;
        } else {
          console.warn('Versions are corrupted. Current is', data.version, ' new one is ', fromVersion);
        }
        var needUpdate = false;

        records.forEach(function(updateItem) {
          var item = findById(updateItem.id);
          if(!item) {
            item = {
              id: updateItem.id
            };
            data.push(item);
          }

          if(correctVersion) {
            item.points = updateItem.points || item.points;
            item.name =  updateItem.name || item.name;
          } else {
            item.name = item.name || updateItem.name;
            item.points = item.points || updateItem.points;
          }
          item._meta_ = { className: 'changed' };
          $timeout(function() {
            delete item._meta_;
          }, 2000);

          //console.log('Update', item, updateItem.points);
          needUpdate = true;
        });
        if(needUpdate) {
          $rootScope.$applyAsync();
        }
      }

      var getWsUpdates = function(updateScope) {
        var ws = new WebSocket('ws://rating.smartjs.academy/rating');
        ws.addEventListener('message', function (e) {
          var updateData;
          try{ updateData = JSON.parse(e.data)
          } catch(e) { updateData = { updates: []}; }
          updateDataList(updateData.updates, updateData.fromVersion, updateData.toVersion)
        });
      };

      return {
        getData: function() {
          getWsUpdates();
          $http
            .get('http://rating.smartjs.academy/rating?hardMode')
            .then(function(response) {
              updateDataList(response.data.records, null, response.data.version);
            });
          return data;
        }
      };
    }])
    .controller('MainController', MainController)

  /** @ngInject */
  function MainController($scope, $timeout, loadService) {
    $scope.userData = loadService.getData();
  }
})();
