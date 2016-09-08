// controller for start & end inputs
app.controller('inputsController', ['$scope', '$http', '$state', '$sce', 'RestaurantAndRoute', 'Auth', function($scope, $http, $state, $sce, RestaurantAndRoute, Auth) {

  if (!Auth.check()) {
    // if a user is not logged in, redirect to login page
    console.log('You are not logged in!');
    $state.go('login');

  } else {

    $scope.start; // start location input
    $scope.end; // end location input
    $scope.map; //store map
    $scope.directions = ''; // directions from start to end

    $scope.logout = () => {
      Auth.delete();
      $state.go('login');
    }

    // POST users' start and end locations to server
    $scope.submit = function(form) {

      // to refresh states from main.map, need to redirect to main first
      $state.go('main');

      if (form.$valid) {
        RestaurantAndRoute.fetchRestaurants($scope.start, $scope.end).then(restaurants => {
          $state.go('main.map');

          // update list of restaurants in the factory
          console.log('restaurants: ', restaurants);

          var directionsService = new google.maps.DirectionsService;
          var directionsDisplay = new google.maps.DirectionsRenderer;
          var map;

          // create a map with restaurant markers and rendered route
          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              zoom: 14
            })
            $scope.map = map;
            // Associate the route with our current map
            directionsDisplay.setMap(map);
            //clear existing markers
            RestaurantAndRoute.removeMarkers();
            //add restaurant markers
            RestaurantAndRoute.addMarkers(map);
            // set the current route
            RestaurantAndRoute.calculateAndDisplayRoute(directionsService, directionsDisplay, $scope.start, $scope.end);
          }
          initMap();
        }).catch(err => {
          console.log('Error submitting: ', err);
        })
      }
    };

    //Shows the appropriate restaurant info window on the map when clicked in the list
    $scope.showInfoWindow = (restaurant) => {
      RestaurantAndRoute.openInfoWindow($scope.map, restaurant.name);
    };
  }

}]);
