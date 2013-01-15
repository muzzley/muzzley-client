var domready = require('domready');
var socket = require('./rpc/socket.js');

domready(function () {
  
 socket();

});