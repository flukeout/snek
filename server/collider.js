module.exports = function collider(other, head, next){
  var main = (other.x == head.x && other.y == head.y );
  var secondary = !next ? false : (other.x == next.x && other.y == next.y );
  return main || secondary;
};
