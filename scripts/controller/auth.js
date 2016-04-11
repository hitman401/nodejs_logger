window.logVisualiser.controller('authCtrl', ['$scope', '$state', '$http', function($scope, $state, $http) {

  $scope.uid = window.localStorage.getItem('uuid');

  $scope.isUIDValid = function(uid) {
    $http({
      method: 'GET',
      url: '/auth/' + uid
    }).then(function successCallback() {
      $state.go('logs', {uid: uid});
    }, function errorCallback(response) {
      if (response.status === 401) {
        alert('UID is not valid');
      } else {
        alert(response.statusText);
      }
    });
  };

  $scope.viewLogs = function(uid) {
    $state.go('logs', {uid: uid});
  };

  $scope.getUID = function() {
    $http({
      method: 'GET',
      url: '/auth/generateId'
    }).then(function successCallback(response) {
      $scope.uid = response.data;
      window.localStorage.setItem('uuid', $scope.uid);
    }, function errorCallback(response) {
      alert(response.statusText);
    });
  };

}]);
