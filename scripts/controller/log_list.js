window.logVisualiser.controller('logListCtrl', ['$scope', '$state', '$stateParams', '$http',
  function($scope, $state, $stateParams, $http) {
    var PAGE_SIZE = 100;
    var uid = null;
    var filterParams = '';

    $scope.endOfRecords = false;
    $scope.logs = [];
    $scope.hiddenFields = [
      'file',
      'line',
      'thread',
      'module'
    ];
    var criteria = {};
    var init = function() {
      uid = getUID();
      if (uid) {
        return;
      }
      $state.go('login');
    };

    var getUID = function() {
      return localStorage.getItem('logviz_uid');
    };

    var isCriteriaSet = function() {
      return Object.keys(criteria).length > 0;
    };

    $scope.toggleHiddenField = function(field) {
      var index = $scope.hiddenFields.indexOf(field);
      if (index === -1) {
        $scope.hiddenFields.push(field);
        return;
      }
      $scope.hiddenFields.splice(index, 1);
    };

    $scope.updateCriteria = function(level) {
      criteria = level ? {
        level: level
      } : {};
      console.log(criteria);
      $scope.logs = [];
      $scope.endOfRecords = false;
      $scope.search();
    };

    $scope.search = function() {
      filterParams = '';
      if (isCriteriaSet()) {
        for (var key in criteria) {
          filterParams += '&' + key + '=' + criteria[key];
        }
      }
      $http({
        method: 'GET',
        url: '/logs/search/' + uid + '?offset=' + $scope.logs.length + '&limit=' + PAGE_SIZE + filterParams
      }).then(function(response) {
        if (response.data.length == 0 || response.data.length < PAGE_SIZE) {
          $scope.endOfRecords = true;
        }
        if (response.data.length === 0) {
          return;
        }
        $scope.logs = $scope.logs.concat(response.data);
      }, function(err) {
        console.error(err);
      });
    };

    $scope.list = function() {
      if (isCriteriaSet()) {
        return this.search();
      }
        $http({
          method: 'GET',
          url: '/logs/' + uid + '?offset=' + $scope.logs.length + '&limit=' + PAGE_SIZE
        }).then(function(response) {
          if (response.data.length == 0 || response.data.length < PAGE_SIZE) {
            $scope.endOfRecords = true;
            $scope.$applyAsync();
          }
          if (response.data.length === 0) {
            return;
          }
          // TODO integrate pagination
          $scope.logs = $scope.logs.concat(response.data);
        }, function(err) {
          console.error(err);
        });
    };

    $scope.exportLogs = function() {
      var clearLogFile = function() {
        $http({
          method: 'GET',
          url: '/logs/clearTemp/' + uid
        }).then(function(response) {}, function(err) {})
      };
      $http({
        method: 'GET',
        url: '/logs/export/' + uid
      }).then(function(response) {
        var win = window.open('/logs/download/' + uid);
        win.onbeforeunload = clearLogFile;
      }, function(err) {
        console.error(err);
      });
    };

    var startWorker = function() {
      var locationHash = location.hash.split('/');
      var worker = new Worker('/scripts/message_worker.js');
      worker.postMessage({
        id: uid,
        serverPath: window.location.host
      });
      worker.addEventListener('message', function(e) {
        console.log('Recieved', e.data);
        var data = JSON.parse(e.data);
        if (isCriteriaSet()) {
          var fields = Object.keys(criteria);
          for (var field in fields) {
            if (data[fields[field]].toLowerCase() !== criteria[fields[field]].toLowerCase()) {
              return;
            }
          }
        }
        $scope.logs.unshift(data);
        $scope.$applyAsync();
      });
    };

    init();
    $scope.list();
    startWorker();
  }
]);
