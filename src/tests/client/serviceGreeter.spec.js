describe("getGreeting", function() {
  var greeter;
  beforeEach(module('demo'));
  beforeEach(inject(function(_greeter_) {
    greeter = _greeter_;
  }));

  it("says Hello to me", function() {
    expect(greeter.getGreeting("Dave")).to.equal("Hello Dave");
  });
});
