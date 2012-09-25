// Specific/Concrete Widgets must implement the onMessage(message, user) argument
define(function() {
  var Gamepad = function(definition) {
    this.definition = definition;
  };
  
  Gamepad.prototype.onMessage = function(message, user) {
    console.log("Gamepad Message Received:");
    console.log(message);
//    if (message.t == 'btnDown') {
//      this.buttonPressed(message, user);
//    }
  }
  
//  Gamepad.prototype.buttonPressed = function(message, user) {
//    console.log("Gamepad button has been pressed:");
//    console.log(message);
//  }
  
  // And now return the constructor function
  return Gamepad;
});
