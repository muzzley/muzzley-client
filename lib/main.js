var domready = require('domready');
var socket = require('./rpc/socket.js');

var muzzley = function(token, callback){
  domready(function () {
    socket(token, function(activity){
      callback(activity);
    });
  });
};


module.exports.connect = muzzley;