define('Widget', function() {
  
  function Widget(type, options, onReadyCallback) {
    // Does it make sense to provide the following fields?
    this.id = options.id;
    this.type = options.type;
    this.name = options.name;
    // options also contains the field "definitions"
    
    var self = this;
    var concreteWidgetModuleName = 'widgets/' + type; // TODO Type should be a numerical ID, right?
    require(concreteWidgetModuleName, function(ConcreteWidget) {
      self.concreteWidget = new ConcreteWidget(options.definition);
      onReadyCallback();
    });
  };
  
  Widget.prototype = {
    getId: function() {
      return this.id;
    },
    getType: function() {
      return this.type;
    },
    getName: function() {
      return this.name;
    },
    onMessage: function(message) {
      this.concreteWidget.onMessage(message);
    }
  }
  
  // And now return the constructor function
  return Widget;
  
});
