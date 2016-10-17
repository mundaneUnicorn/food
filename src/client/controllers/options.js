app.controller('optionsController', ['$http', '$scope', '$localStorage', '$state', function($http, $scope, $localStorage, $state) {

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
    // populate the preferences to the list
    $scope.tags = result.data;
  }).catch(err => {
    console.log('Error retrieving preferences: ', err);
  });

  $scope.submitTag = () => {
    if ($scope.tags.indexOf($scope.prefs.toLowerCase()) === -1) {
      $scope.tags.push($scope.prefs.toLowerCase());
    }
    $scope.prefs = '';
    save();
  }

  $scope.deleteTag = (tag) => {
    $scope.tags.splice($scope.tags.indexOf(tag), 1);
    save();
  }

  var save = () => {

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

        $scope.submit(); // refreshes the list of restaurants with the filters applied

      } else {
        console.log('Something went wrong', results.data.message);
      }
    }).catch(err => {
      console.log('Error saving prefs: ', err);
    })
  }
  
}])