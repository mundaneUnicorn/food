app.controller('start', ['$scope', '$state', '$localStorage', '$http', 'PageTransitions', 'RestaurantAndRoute', function($scope, $state, $localStorage, $http, PageTransitions, RestaurantAndRoute) {
  PageTransitions.showBackground();
  PageTransitions.transNavOn();

  $scope.stopsList = [{}, {}];

  $scope.data = {
    mode: 'driving',
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

  $scope.addNewStop = function(){
    //var newItemNo = $scope.stopsList.length+1;
    //$scope.stopsList.push({'id':'choice'+newItemNo});
    $scope.stopsList.push({})
    console.log($scope.stopsList)
  }


}])