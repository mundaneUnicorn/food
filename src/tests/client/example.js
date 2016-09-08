describe('Examples', function() {

  //'describe' statements can be nested to create sub-sections
  describe('someFunction()', function() {

    //'it' statements describe what the test is checking for
    //Descriptions should describe the intended behavior
    it('should be a number', function() {

      //Check type
      var foo = 15;
      expect(foo).toEqual(jasmine.any(Number));
    });

    it('should equal some value', function() {

      //Check equality
      var foo = 'bar';
      expect(foo).toEqual('bar');
    });
  });
});
