window.logVisualiser.controller('authCtrl', ['$scope', '$state', '$http', function($scope, $state, $http) {
  $scope.uid = null;

  var init = function() {
    localStorage.clear();
  };

  $scope.setUID = function() {
    if (!$scope.uid) {
      return alert('Enter vault/client id to view logs');
    }
    localStorage.setItem('logviz_uid', $scope.uid);
    $state.go('logs');
  };
  init();
}]);
