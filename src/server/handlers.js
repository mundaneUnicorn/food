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
var stripe = require("stripe")("sk_test_xg4PkTku227mE5Pub1jJvIj5");
var https = require('https');
var nodemailer = require('nodemailer');

const gmapsURL = 'https://maps.googleapis.com/maps/api/directions/json';

var yelp = new Yelp({
  'consumer_key': keys.yelp,
  'consumer_secret': keys.yelpSecret,
  'token': keys.yelpToken,
  'token_secret': keys.yelpTokenSecret
});

var lastSearch;


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
  getRoutes: function (req, res, next) {
    // Concatenate query parameters into HTTP request friendly string.
    let queryString = qs.stringify({
      origin: req.body.start,
      destination: req.body.end,
      waypoints: req.body.stops || null,
      optimizeWaypoints: true,
      key: keys.googleMaps,
      mode: req.body.mode,
    });

    // Specify parameters for request.
    let options = {
      url: `${gmapsURL}?${queryString}`,
      method: 'GET'
    };


    // Make request to Google Directions API.
    request(options).then(function (results){
      var routesArray = JSON.parse(results.body).routes;

      var totalRouteDistance = 0;
      routesArray[0].legs.forEach(function (leg) {
        totalRouteDistance += leg.distance.value;
      });
      console.log(totalRouteDistance,"Total Route Distance")
      lastSearch = {
        routesArray: routesArray,
        totalRouteDistance: totalRouteDistance
      }
      if (totalRouteDistance > 804672){
        res.status(401).end()
      } else {
        res.status(201).end()
      }

    })

  },

  // Takes form data from submit
  // Outputs routes or addresses for the map

  submit: function(req, res, next) {
      User.findOne({
        username: req.body.user,
      }).then(function (response) {
        // Call getRestaurants along the returned route.

        if (!response){
          module.exports.getRestaurants(res,req.body.routesArray, req.body.totalRouteDistance);
        } else {
          module.exports.getRestaurants(res, req.body.routesArray, req.body.totalRouteDistance, response.preferences);
        }

      }).catch(function (error) {
        console.log(error,"server side error")
        // Call getRestaurants along the returned route.
        module.exports.getRestaurants(res,req.body.routesArray, req.body.totalRouteDistance);

      });


  },

  chargeCard: (req,res) => {
    var token = req.body.stripeToken; // Using Express

    var charge = stripe.charges.create({
      amount: 1000, // Amount in cents
      currency: "usd",
      source: token,
      description: "Example charge"
    }, function(err, charge) {
      if (err && err.type === 'StripeCardError') {
        res.status(400)
      } else {
        res.status(201).send("Charge succesful")
      }
    });
  },

  /*
   * Input: Array
   * Output: Promise
   * Description: Takes in the route object returned by Google's API,
   *              and returns an array of restaurant objects from Yelp.
   */
  getRestaurants: (res, preferences) => {
    preferences = preferences || [];

    // Object to be returned to the client.
    // Stores route and restaurants in two seperate arrays.
    var responseObject = {
      route: lastSearch.routesArray,
      restaurants: [],
    };

    // // Use a different radius for longer routes.     //num prev 7500
    var yelpSearchRadius = lastSearch.totalRouteDistance > 150000 ? 7500 :
                              lastSearch.totalRouteDistance > 8750 ? lastSearch.totalRouteDistance / 50 : 175;

    // Use these. They are auto-distributed with a bias towards population centers.
    var latLngPairs = polyline.decode(lastSearch.routesArray[0].overview_polyline.points);

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

    // Keeps track of the number of Yelp queries we've made.
    var queryCounter = 0;
    var validBusinesses;
    var searchParameters;

    // Makes a unique Yelp query for each target along the given route.
    queryTargets.forEach(function (target, index) {

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
  }, 

  emailFavoritesList: (req, res) => {
    
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'foodcrawl2016@gmail.com', // Your email id
            pass: keys.gmailPass // Your password
        }
    });

    var html = '<h3 style="display:block;font-size:22"> Your selections are: </h3>' + req.body.favsHtml;

    var mailOptions = {
        from: '"Food Crawl" <foodcrawl2016@gmail.com>', // sender address
        to: req.body.userEmail,// list of receivers
        subject: 'Welcome to Food Crawl!', // Subject line
        html: html // You can choose to send an HTML body instead
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.send('Error is: ' + error);
        } else {
          res.send('Email sent.');
        }
    });
  } 

};
