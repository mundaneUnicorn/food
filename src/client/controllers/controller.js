// controller for start & end inputs
app.controller('inputsController', ['$scope', '$http', '$state', 'RestaurantAndRoute', '$localStorage', 'Addresses', 'PageTransitions', function($scope, $http, $state, RestaurantAndRoute, $localStorage, Addresses, PageTransitions) {

  PageTransitions.hideBackground();
  PageTransitions.transNavOff();

  var mapAndListContainerHeight = $(window).height() - 60;
  var restaurantListHeight = $(window).height() - 100;

  $('#mapAndListContainer').css('height', mapAndListContainerHeight + 'px');
  $('#restaurantDiv').css('height', restaurantListHeight + 'px');

  Materialize.updateTextFields(); // solves input field placeholder overlapping issue
  $('select').material_select(); // solves select issues

  $scope.stopsList = [{}, {}];

  $scope.map; // store map

  $scope.data = {
    mode: 'driving',
    userEmail: ''
  }
  $scope.userEmail;

  $scope.user;
  $scope.activeUser; // true if a user is logged in
  $scope.newUser = false; // true if a new user wants to sign up

  let handler = StripeCheckout.configure({
    key: 'pk_test_Xz3V8MOTjqbGd0eH8JGUDVkN',
    image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
    locale: 'auto',
    token: function(token) {
      return $http({
        method: 'POST',
        url: '/chargeCard',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          stripeToken: token
        }
      }).then(data => {
        //data.data === "Charge succesful"

        RestaurantAndRoute.fetchRestaurants()
           .then ( res => {
             console.log(res,"res")
             renderMap()
           })
           .catch(err => {
             console.log('Error submitting: ', err);
           })
      }).catch(err => {
        console.log(err,"error")
      })
    }
  });

  var renderMap = () => {
    $state.go('home.main.map');

    // update list of restaurants in the factory
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var map;

    // create a map with restaurant markers and rendered route
    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14
      });
      $scope.map = map;
      // Associate the route with our current map
      directionsDisplay.setMap(map);
      //clear existing markers
      RestaurantAndRoute.removeMarkers();
      //add restaurant markers
      RestaurantAndRoute.addMarkers(map);
      // set the current route

      RestaurantAndRoute.calculateAndDisplayRoute(directionsService, directionsDisplay, $scope.stopsList[0].name, $scope.stopsList[$scope.stopsList.length-1].name, $scope.data.mode, $scope.stopsList);
    }

    initMap();
  }

  // toggles active user depending on the presence of a logged in user
  if ($localStorage.username) {
    $scope.activeUser = true;
    $scope.user = $localStorage.username;
  } else {
    $scope.activeUser = false;
  }

  $scope.addNewStop = function(){
    //var newItemNo = $scope.stopsList.length+1;
    //$scope.stopsList.push({'id':'choice'+newItemNo});
    $scope.stopsList.push({})
    console.log($scope.stopsList)
  }

  $scope.logout = () => {
    console.log('Logged out');
    delete $localStorage.username;
    $scope.activeUser = false;
    $scope.newUser = false;
    $scope.user = null;
    $state.reload();
  };

  $scope.showOptions = false;
  $scope.invalidOptions = false;
  $scope.displayOptions = () => {
    if ($localStorage.username) {
      $scope.hideAddresses();
      $scope.showOptions = true; // toggles options view
      $scope.invalidOptions = false;
    } else {
      $scope.invalidOptions = true;
    }
  };

  $scope.hideOptions = () => {
    if ($localStorage.username) {
      $scope.showOptions = false; // toggles options view
      $scope.invalidOptions = false;
    } else {
      $scope.invalidOptions = true;
    }
  };

  $scope.showAddresses = false;
  $scope.invalidAddresses = false;
  $scope.displayAddresses = () => {
    if ($localStorage.username) {
      $scope.hideOptions();
      $scope.showAddresses = true; // toggles addresses view
      $scope.invalidAddresses = false;
    } else {
      $scope.invalidAddresses = true;
    }
  };

  $scope.hideAddresses = () => {
    if ($localStorage.username) {
      $scope.showAddresses = false; // toggles addresses view
      $scope.invalidAddresses = false;
    } else {
      $scope.invalidAddresses = true;
    }
  }

  $scope.requestCurrentLocation = () => {

    if (navigator.geolocation) {
      console.log('Geolocation is supported!');

      var geoSuccess = function(position) {
        var coords = position.coords.latitude.toString() + " " + position.coords.longitude.toString();

        $scope.stopsList[0].name = coords;
        $scope.$digest();
        //console.log($scope.data.start);
        // var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + startPos.coords.latitude + "," + startPos.coords.longitude + "&key=AIzaSyDmA8w7Cs4Tg8I8ER-OzpPe210JWkZBGkA"

        // $http({
        //   method: 'GET',
        //   url: url,
        // }).then( queryResult => {
        //   console.log(queryResult)
        //   $scope.data.start = queryResult.data.results[0].formatted_address
        // })
        // document.getElementById('startLat').innerHTML = startPos.coords.latitude;
        // document.getElementById('startLon').innerHTML = startPos.coords.longitude;
      };
      var geoError = function(error) {
        console.log('Error occurred. Error code: ' + error.code);
        // error.code can be:
        //   0: unknown error
        //   1: permission denied
        //   2: position unavailable (error response from location provider)
        //   3: timed out
      };

      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    }
    else {
      console.log('Geolocation is not supported for this Browser/OS version yet.');
    }
  }

  // POST users' start and end locations to server
  $scope.submit = function() {
    //clear old data
    RestaurantAndRoute.clearStoredRestaurants();
    // to refresh states from main.map, need to redirect to main first
    $state.go('home.main');


    RestaurantAndRoute.checkRoute($scope.stopsList, $scope.data.mode)
      .then(response => {
        console.log(response)
        if (response === "Payment Required"){
          handler.open({
              name: 'Demo Site',
              description: '2 widgets',
              amount: 2000
            })
        } else {
          RestaurantAndRoute.fetchRestaurants()
             .then ( res => {
               renderMap()
             })
             .catch(err => {
               console.log('Error submitting: ', err);
             })
        }
      }).catch(err => {
        console.log('Error submitting: ', err);
      });


  };

  //Shows the appropriate restaurant info window on the map when clicked in the list
  $scope.showInfoWindow = (restaurant) => {
    RestaurantAndRoute.openInfoWindow($scope.map, restaurant.name);
  };

  $scope.stars = (rating) => {
    let numOfstars = Math.floor(rating);
    let result = '';
    for (let i=0; i<numOfstars; i++) {
      result += '★';
    }
    return result;
  }

  $scope.submitFavorites = () => {
    RestaurantAndRoute.submitFavorites($scope.data.userEmail);
  };
  
}]);
