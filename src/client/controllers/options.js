app.controller('optionsController', ['$http', '$scope', '$localStorage', 'Auth', '$state', function($http, $scope, $localStorage, Auth, $state) {
  if (!Auth.check()) {
    console.log('Must log in to choose preferences!');
    $state.go('main');
  } else {
    // a collection of user submitted preferences
    $scope.tags = [];

    // on page load, retrieve the user preferences from database
    $http({
      method: 'GET',
      url: '/options',
      params: {
        user: $localStorage.username
      }
    }).then(result => {
      // push the preferences to the list
      $scope.tags = result.data;
    }).catch(err => {
      console.log('Error retrieving preferences: ', err);
    });

    $scope.submitTag = () => {
      if ($scope.tags.indexOf($scope.prefs.toLowerCase()) === -1) {
        $scope.tags.push($scope.prefs.toLowerCase());
      }
      $scope.prefs = '';
    }

    $scope.deleteTag = (tag) => {
      $scope.tags.splice($scope.tags.indexOf(tag), 1);
    }

    $scope.save = () => {

      // save the collection of preferences to database
      $http({
        method: 'POST',
        url: '/options',
        data: {
          username: $localStorage.username,
          userPrefs: $scope.tags
        }
      }).then(results => {
        if (results.data.valid) {
          console.log('Preferences saved.');

          // redirect the user back to /main/map
          // $state.go('main.map');

        } else {
          console.log('Something went wrong', results.data.message);
        }
      }).catch(err => {
        console.log('Error saving prefs: ', err);
      })
    }
  }
}])