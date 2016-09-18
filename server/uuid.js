module.exports = (function() {
  var uid = 0;
  return function() {
    return ++uid;
  };
}());
