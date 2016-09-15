var bb = require('bluebird');
var request = bb.promisify(require('request'));
var request2 = require('request');
var keys = require('./keys.js');
var qs = require('querystring');
var Yelp = require('yelp');
var session = require('express-session');
var _ = require('lodash');
var User = require('./dbconfig/schema.js').User;
var Address = require('./dbconfig/schema.js').Address;
var bcrypt = require('bcrypt');
var polyline = require('polyline');
var geolib = require('geolib');

const gmapsURL = 'https://maps.googleapis.com/maps/api/directions/json';

var yelp = new Yelp({
  'consumer_key': keys.yelp,
  'consumer_secret': keys.yelpSecret,
  'token': keys.yelpToken,
  'token_secret': keys.yelpTokenSecret
});

module.exports = {
  login: (req, res, next) => {
    var username = req.body.username;
    var password = req.body.password;

    User.findOne({username: username}).then(user => {
      if (user) {
        // sets the current session to the logged in user
        // req.session.username = username;

        // Checks the hashed password in the database against the password
        // attached to the request body.
        bcrypt.compare(password, user.password, function (error, result) {

          if (error) {
            // Conditional to catch any errors the bcrypt module throws.
            console.log(error);
            res.send({message: 'Error signing in.', valid: false});

          } else if (result) {
            // Conditional where the hashed and unhashed passwords match.
            res.send({message: 'Successfully signed in.', valid: true});

          } else {
            // Conditional where the hashed and unhashed passwords don't match.
            res.send({message: 'Invalid password.', valid: false});
          }
        });
      } else {
        // Conditional for when the username is not found in the database.
        res.send({message: 'Invalid username.', valid: false});
      }
    });
  },

  signup: (req, res, next) => {
    var username = req.body.username;
    var password = bcrypt.hashSync(req.body.password, 5);
    User.find({username: username}).then(users => {
      if (users.length) {
        res.send({message: 'That username already exists.', valid: false});
      } else {
        // adds a new user to the database
        new User({username: username, password: password}).save().then(user => {
          // req.session.username = username;
          res.send({message: 'New user added to database', valid: true});
        })
      }
    });
  },

  saveOptions: (req, res, next) => {
    // updates user preferences in the database
    var username = req.body.username;
    var prefs = req.body.userPrefs;
    User.findOneAndUpdate({username: username},
                          {$set: {preferences: prefs}},
                          {new: true},
                          (err, result) => {
      if (err) {
        res.send({message: 'Error updating preferences.', valid: false});
      } else {
        res.send({message: 'Preferences updated.', valid: true});
      }
    });
  },

  getOptions: (req, res, next) => {
    // sends user preferences to the client
    var username = req.query.user;
    User.findOne({username: username}).then(user => {
      res.send(user.preferences);
    }).catch(err => {
      res.send('Error retrieving preferences.');
    });
  },


  /*
   * Input: (String, String, Function)
   * Output: Promise
   * Description: Given a starting and ending address, gives an object
   *              containing an array of routes in promise form.
   */
  getRoutes: function (origin, destination, mode) {

    // Concatenate query parameters into HTTP request friendly string.
    let queryString = qs.stringify({
      origin: origin,
      destination: destination,
      key: keys.googleMaps,
      mode: mode,
    });

    // Specify parameters for request.
    let options = {
      url: `${gmapsURL}?${queryString}`,
      method: 'GET'
    };

    // Make request to Google Directions API.
    return request(options);
  },

  // Takes form data from submit
  // Outputs routes or addresses for the map
  submit: function(req, res, next) {
    module.exports.getRoutes(req.body.start, req.body.end, req.body.mode)
    .then(results => {
      // Parse nested object returned by Google's API to
      // specifically get Array of routes.
      var routesArray = JSON.parse(results.body).routes;

      User.findOne({
        username: req.body.user,
      }).then(function (response) {

        // Call getRestaurants along the returned route.
        module.exports.getRestaurants(req, res, routesArray, response.preferences);

      }).catch(function (error) {

        // Call getRestaurants along the returned route.
        module.exports.getRestaurants(req, res, routesArray);

      });
    })
    .catch(err => {
      console.log('Error requesting routes: ', err);
      res.end();
    });
  },

  /*
   * Input: Array
   * Output: Promise
   * Description: Takes in the route object returned by Google's API,
   *              and returns an array of restaurant objects from Yelp.
   */
  getRestaurants: (req, res, routesArray, preferences) => {
    preferences = preferences || [];

    // Object to be returned to the client.
    // Stores route and restaurants in two seperate arrays.
    var responseObject = {
      route: routesArray,
      restaurants: [],
    };

    // Determine the total length of a route in meters.
    var totalRouteDistance = 0;
    routesArray[0].legs.forEach(function (leg) {
      totalRouteDistance += leg.distance.value;
    });

    // // Use a different radius for longer routes. 
    var yelpSearchRadius = totalRouteDistance > 150000 ? 3000 :
                              totalRouteDistance > 8750 ? totalRouteDistance / 50 : 175;    

    // Use these. They are auto-distributed with a bias towards population centers.
    var latLngPairs = polyline.decode(routesArray[0].overview_polyline.points);

    var shouldUseHalfDistance = true;
    var minSeparationForQueries = yelpSearchRadius / 2;
    var currentPoint = latLngPairs[0];
    var queryTargets = [];

    // Loop through the lat lng pairs that make up the total root and select points that 
    // will provide yelp queries that are spread out evenly along the route, without multiple
    // queries falling within overlapping search radii, since these produce redundant results. 
    for ( var i = 1; i < latLngPairs.length; i++ ){
      if ( geolib.getDistance(currentPoint, latLngPairs[i]) >= minSeparationForQueries ){
        queryTargets.push(latLngPairs[i]);
        currentPoint = latLngPairs[i];

        // Only the first query needs to be set to the half radius. Once this has started, move the 
        // separation to a yelpSearchDiameter.
        if ( shouldUseHalfDistance ) {
          minSeparationForQueries = yelpSearchRadius;
          shouldUseHalfDistance = false;
        }
      }
    }

    // These console.logs tell you the selectiveness of the filter above
    console.log("LENGTH OF OVERVIEW IS: ", latLngPairs.length);
    console.log("LENGTH OF FILTERED OVERVIEW IS: ", queryTargets.length);
  
    // Keeps track of the number of Yelp queries we've made.
    var queryCounter = 0;
    var validBusinesses;
    var searchParameters;

    // Makes a unique Yelp query for each target along the given route.
    queryTargets.forEach(function (target, index) {
      // console.log(target);
      // Establish parameters for each individual yelp query.
      searchParameters = {
        'radius_filter': yelpSearchRadius,
        'll': `${target[0]},${target[1]}`,
        'accuracy': 100,
        'category_filter': 'restaurants',
        'term': preferences.join('_') + '_restaurants'
      };

      // Query Yelp's API.
      yelp.search(searchParameters)

        // Sucess callback
        .then(function (searchResults) {

          // Filter out businesses returned by yelp that are in weird locations.
          validBusinesses = searchResults.businesses.filter(function (item) {

            if (!item.location.coordinate) {
              // If the business doesn't have a location property, filter it out.
              return false;

            } else {

              //Calculate the how far away the business is.
              var latDifference = target[0] - item.location.coordinate.latitude;
              var lngDifference = target[1] - item.location.coordinate.longitude;
              var totalDegreeDifference = Math.sqrt(Math.pow(latDifference, 2) + Math.pow(lngDifference, 2));
              var totalDistance = totalDegreeDifference / 0.000008998719243599958;

              // Compare the distrance from the business agains the upper limit,
              // and filter accordingly, with a larger number used to filter for longer trips.
              return totalDistance <= yelpSearchRadius;
            }
          });

          // Add the returned businessees to the restauraunts array.
          responseObject.restaurants = responseObject.restaurants.concat(validBusinesses);
          responseObject.restaurants = _.uniqBy(responseObject.restaurants, 'id');

          // Send a response to the client if all requisite queries have been made.
          queryCounter++;
          queryCounter >= queryTargets.length ? res.send(responseObject) : null;
        })

        // Error callback
        .catch(function (error) {
          console.log('Yelp returned an error:', error);

          // Send a response to the client if all requisite queries have been made.
          queryCounter++;
          queryCounter >= queryTargets.length ? res.send(responseObject) : null;
        });
    });
  },

  /**
   * Input: String
   * Output: Array
   * Description: Returns a list of addresses for a specific user
   */
  getAddresses: (req, res, next) => {
    let user = req.query.user;

    //get user id
    User.findOne({username: user})

    //search by addresses user id
    .then(user => {
      if (user) {
        Address.find({user: user._id})
          .then(addresses => {
            res.send(addresses);
          });
      } else {
        res.send([]);
      }
    })

    .catch(error => {
      console.log('Error getting addresses: ', error);
      res.send([]);
    });
  },

  /**
   * Input: Object
   * Output: Undefined
   * Description: Saves a new address
   */
  saveAddress: (req, res, next) => {
    let address = req.body;

    //Get user id by username
    User.findOne({username: address.user})
    .then(user => {
      //create new address
      return new Address({
        user: user._id,
        //address lines
        label: address.label,
        location: address.location
      }).save();
    })
    .then(() => {
      res.send();
    })
    .catch(error => {
      console.log('Error saving address: ', error);
    });
  }
};
