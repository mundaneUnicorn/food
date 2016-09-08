describe('Examples', function() {

  //'describe' statements can be nested to create sub-sections
  describe('someFunction()', function() {

    //'it' statements describe what the test is checking for
    //Descriptions should describe the intended behavior
    it('should be a string', function() {

      //Check type
      var foo = {};
      expect(foo).to.be.a('string');
    });

    it('should equal some value', function() {

      //Check equality
      var foo = 'bar';
      expect(foo).to.equal('bar');
    });
  });
});
