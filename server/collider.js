module.exports = function collider(one,two){
    if(one.x == two.x && one.y == two.y ) {
      return true;
    } else {
      return false;
    }
  }
