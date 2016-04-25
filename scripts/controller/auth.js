window.logVisualiser.controller('authCtrl', ['$scope', '$state', '$http', function($scope, $state, $http) {
  $scope.uid = null;

  var init = function() {
    localStorage.clear();
  };

  $scope.setUID = function() {
    if (!$scope.uid || isNaN($scope.uid)) {
      return console.error('UID must be valid and numberic');
    }
    localStorage.setItem('logviz_uid', $scope.uid);
    $state.go('logs');
  };
  init();
}]);
