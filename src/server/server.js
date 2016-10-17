var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var session = require('express-session');
var handlers = require('./handlers.js');
var keys = require('./keys.js')

// open connection to MongoDB database
mongoose.connect(keys.MONGOLAB_URI);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'FOOD', resave: true, saveUninitialized: true }))

// serves initial static files
app.use('/', express.static(path.join(__dirname, '../client')));
app.use('/lib', express.static(path.join(__dirname, '../../node_modules')));

app.get('/options', handlers.getOptions); // retrieves user prefs
app.get('/addresses', handlers.getAddresses); //retrieve user addresses

app.post('/maps/submit', handlers.submit);
app.post('/login', handlers.login);
app.post('/signup', handlers.signup);
app.post('/options', handlers.saveOptions); // saves user prefs
app.post('/addresses', handlers.saveAddress); //save an address
app.post('/chargeCard', handlers.chargeCard);
app.post('/checkRoute', handlers.getRoutes);
app.post('/favorites', handlers.emailFavoritesList);

app.listen(process.env.PORT || 8000);
console.log('Now listening on 127.0.0.1:8000') 


