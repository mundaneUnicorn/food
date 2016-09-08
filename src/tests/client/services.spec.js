describe('Services', function() {
  // Import the corresponding module
  beforeEach(module('foodfood'));

  describe('RestaurantAndRoute factory')
  var $httpBackend, Links;

    beforeEach(inject(function (_$httpBackend_, _RestaurantAndRoute_) {
      $httpBackend = _$httpBackend_;
      RestaurantAndRoute = _RestaurantAndRoute_;
    }));

    it('should exist for real', function () {
      expect(RestaurantAndRoute).to.exist;
    });
})
