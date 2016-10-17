var app = angular.module('foodfood', ['ui.router', 'ngStorage', 'ngAutocomplete', 'ui.materialize']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  $stateProvider
  .state('home', {
    views: {
      '': {
        templateUrl: './views/home.html',
        controller: 'home'
      }
    }
  })
    .state('home.start', {
      url: '/',
      views: {
        '': {
          templateUrl: './views/start.html', //TODO
          controller: 'start' //TODO
        }
      }
    })
    .state('home.main', {
      url: '/main',
      views: {
        '': {
          templateUrl: './views/main.html',
          controller: 'inputsController'
        },
        'options@home.main': {
          templateUrl: './views/options.html',
          controller: 'optionsController'
        },
        'addresses@home.main': {
          templateUrl: './views/addresses.html',
          controller: 'addressesController'
        }
      }
    })
    .state('home.auth', {
      url: '/auth',
      views: {
        '': {
          templateUrl: './views/auth.html',
          controller: 'authController'
        }
      }
    })
    .state('home.main.map', {
      url: '/map',
      views: {
        'restaurantList': {
          templateUrl: './views/places.html',
          controller: function($scope, RestaurantAndRoute, Addresses) {
            // restaurants from the server
            var restaurantListHeight = $(window).height() - 200;
            $('.restaurantList').css('height', restaurantListHeight + 'px');

            $scope.sort = {
              input: '-review_count'
            }
            $scope.sortTerm = '-review_count';
            $scope.setSortTerm = function () {
              $scope.sortTerm = $scope.sort.input;
              // if ($scope.sortTerm[0] === '-') {
              //   if ($scope.sortTerm.slice(1) === $scope.sort.input) {
              //     $scope.sortTerm = $scope.sort.input;
              //   } else {
              //     $scope.sortTerm = $scope.sort.input; 
              //   }
              // } else {
              //   if ($scope.sortTerm === $scope.sort.input) {
              //     $scope.sortTerm = '-' + $scope.sort.input;
              //   } else {
              //     $scope.sortTerm = $scope.sort.input;
              //   }
              // }
            };
            $scope.restaurants = RestaurantAndRoute.getRestaurants();
          }
        }
      }
    })

}])