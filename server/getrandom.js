module.exports = function getRandom(min, max){
    return Math.round(min + Math.random() * (max-min));
  }
