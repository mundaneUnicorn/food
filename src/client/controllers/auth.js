app.controller('authController', ['$scope', '$state', '$localStorage', '$http', function($scope, $state, $localStorage, $http) {
  $scope.username;
  $scope.password;

  $scope.invalid = false; // true if username/password is invalid
  
  $scope.loginSubmit = (form) => {
    if (form.$valid) {
      $http({
        method: 'POST',
        url: '/login',
        data: {
          username: $scope.username,
          password: $scope.password
        }
      }).then(result => {

        console.log('Login result: ', result.data);
        if (result.data.valid) {
          /* if username and password are correct,
             save to local storage and set active user */
          $localStorage.username = $scope.username;
          $scope.$parent.user = $scope.username;
          $scope.$parent.activeUser = true;
          $scope.username = '';
          $scope.password = '';
          $scope.invalid = false;
          $scope.$parent.newUser = false;
          $state.go('home.main');
        } else {
          // if invalid login, show error message
          $scope.password = '';
          $scope.invalid = true;
        }
      }).catch(err => {
        console.log('Error signing in: ', err);
      })
    }
  }

  $scope.showNewUserForm = () => {
    // displays the sign-up form
    $scope.$parent.newUser = true;
    $scope.$parent.activeUser = false;
  };

  $scope.newUserSubmit = (form) => { // adds a new user to database
    if (form.$valid) {
      $http({
        method: 'POST',
        url: '/signup',
        data: {
          username: $scope.usernameNew,
          password: $scope.passwordNew
        }
      }).then(result => {

        console.log('Signup result: ', result.data);
        if (result.data.valid) {
          /* if signup is valid, save user to local storage
           and set active user */
          $localStorage.username = $scope.usernameNew;
          $scope.$parent.user = $scope.usernameNew;
          $scope.$parent.activeUser = true;
          $scope.usernameNew = '';
          $scope.passwordNew = '';
          $scope.invalid = false;
          $scope.$parent.newUser = false; // hides newUser div
          $state.go('home.main');
        } else {
          // if invalid signup, show error message
          $scope.passwordNew = '';
          $scope.invalid = true;
        }
      }).catch(err => {
        console.log('Error signing up: ', err);
      });
    }
  };

  $scope.showLoginForm = () => {
    // displays the login form
    $scope.$parent.newUser = false;
    $scope.$parent.activeUser = false;
  };
  
}])