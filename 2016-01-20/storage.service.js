angular.module('test').provider('storageService', function () {
  var key = 'data';
  
  this.setKey = function (newKey) {
    key = newKey;
  };
  
  this.$get = function () {
    return {
      load: function () {
        console.log(localStorage);
        var data = localStorage.getItem(key);
        if (data) {
          return JSON.parse(data);
        } else {
          return ['Иванов', 'Петров', 'Сидоров'];
        }
      },
      
      save: function (data) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    };
  }
});

