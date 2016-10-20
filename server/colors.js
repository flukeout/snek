var colors = require('../client/lib/colors');

var nextColor = (function() {
  var c = 0;
  return function() {
    return colors[c++ % colors.length];
  };
}());

module.exports = nextColor;
