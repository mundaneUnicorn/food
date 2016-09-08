angular.module('demo', [])
.factory('greeter', function() {
  return {
    // ...
    getGreeting: function(name) {
      return "Hello " + name;
    }
  };
});
