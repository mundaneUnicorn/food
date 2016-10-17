app.controller('home', ['$scope', '$state', '$localStorage', function($scope, $state, $localStorage) {
  $scope.user = $localStorage.username;
  
  $scope.logout = () => {
    console.log('Logged out');
    delete $localStorage.username;
    $scope.activeUser = false;
    $scope.newUser = false;
    $scope.user = null;
    $state.reload();
  };
  
}])