app.factory('RestaurantAndRoute', ['$http', function($http) {

  var restaurants = [];
  var markers = [];
  var infoWindows = [];
  var openInfoWindows = [];

  //Creates an info window for a marker
  let createInfoWindow = (place) => {
    //parse categories
    let categories = [];
    place.categories.forEach((category) => {
      categories.push(category[0]);
    });

    //info window html
    let displayHTML = `
      <div class="infoWindow">
        <h2 class="infoName">${place.name}</h2>
        <img class="ratingImg" src="${place.rating_img_url_small}">
        <p class="infoLocation">
          ${place.location.display_address[0]}<br>
          ${place.location.display_address[1]}<br>
          ${place.location.display_address[2]}<br>
          ${place.display_phone}
        </p>
        <p class="infoDescription">
          ${categories.join(', ')}
        </p>
      </div>`;

    //create info window
    let infoWindow = new google.maps.InfoWindow({
      content: displayHTML
    });

    //store info window
    infoWindows.push(infoWindow);
    
    return infoWindow;
  };

  return {

    fetchRestaurants: function(origin, destination) {
      // clear out the array for the new batch of restaurants
      restaurants = [];

      // request the restaurants from the server
      return $http({
        method: 'POST',
        url: '/maps/submit',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          start: origin,
          end: destination
        }
      }).then(data => {

        // filter out any restaurants farther than 60m
        restaurants = data.data.restaurants.filter(restaurant => {
          return restaurant.distance;
        })

        // resolve restaurants for promise chaining
        return restaurants;

      }).catch(err => {
        console.log('Error fetching restaurants: ', err);
      })
    },

    getRestaurants: function() {
      return restaurants;
    },

    /**
     * Input: (Map, Array of Yelp Objects)
     * Output: Undefined
     * Description: Adds a list of markers to a map
     */
    addMarkers: (map) => {
      restaurants.forEach((place) => {
        let lat = place.location.coordinate.latitude;
        let lng = place.location.coordinate.longitude;

        let marker = new google.maps.Marker({
          position: new google.maps.LatLng(lat, lng),
          map: map,
          title: place.name
        });

        //store for removal later
        markers.push(marker);

        //Display an info window when marker is clicked
        let infoWindow = createInfoWindow(place);
        marker.addListener('click', () => {
          //close open info windows
          openInfoWindows.forEach((infoWin) => {
            infoWin.close();
          });
          //remove closed info windows from openInfoWindows
          openInfoWindows = [];

          //keep track of open info windows
          openInfoWindows.push(infoWindow);
          //open current info window
          infoWindow.open(map, marker);
        });
      });
    },

    /**
     * Output: Undefined
     * Description: Removes a list of Markers from their map
     */
    removeMarkers: () => {
      markers.forEach((marker) => {
        marker.setMap(null);
        marker = null;
      });
    },

    /*
      Input: DirectionsService instance, DirectionsRenderer instance, start string, end string
      Output: null
      Description: Renders a route to the map with the given start and end points.
    */
    calculateAndDisplayRoute: (directionsService, directionsDisplay, start, end) => {
      directionsService.route({
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
      }, function(response, status) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
    },

    /**
     * Input: (Map Object, String)
     * Output: Undefined
     * Description: Opens the info window for a given restaurant
     */
    openInfoWindow: (map, name) => {
      //find matching restaurant
      let markerIndex;
      restaurants.forEach((restaurant, index) => {
        //record index where found
        if (name === restaurant.name) {
          markerIndex = index;
        }
      });

      //record info window as open
      openInfoWindows.push(infoWindows[markerIndex]);
      //open info window
      infoWindows[markerIndex].open(map, markers[markerIndex]);
    }

  }
}])
