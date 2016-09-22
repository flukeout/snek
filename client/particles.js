var particles = [];

function makeParticle(options){

  var particle = {
    x :     options.x || 0,
    xV :    options.xV || 0,
    y :     options.y || 0,
    yV :    options.yV || 0,
    z :     options.z || 0,
    zV :    options.zV || 0,

    xR : options.xR || 0,
    xRv : options.xRv || 0,
    yR : options.yR || 0,
    yRv : options.yRv || 0,
    zR : options.zR || 0,
    zRv : options.zRv || 0,

    o : options.o || 1,
    oV : options.oV || 0,

    scale : options.scale || 1,
    scaleV : options.scaleV || 0,

    speed : options.speed || false,
    angle : options.angle || false,

    color:  options.color || false,
    width : options.width || 20,
    height: options.height || 20,

    gravity : options.gravity || 0,

    className : options.className || false,

    lifespan : options.lifespan || 0,
  };


  if(particle.angle) {
    particle.angle =  particle.angle - 180;
    particle.xV = Math.sin(particle.angle * (Math.PI/180)) * particle.speed;
    particle.yV = Math.cos(particle.angle * (Math.PI/180)) * particle.speed;
  }

  particle.el = $("<div class='particle'></div>");
  particle.el.css("height", particle.height);
  particle.el.css("width",  particle.width);
  particle.el.addClass(particle.className);
  particle.el.css("background",particle.color);

  particle.move = function(){

    var p = this;

    p.lifespan--;

    if(p.lifespan < 0) {
      p.el.remove();
      for(var i = 0; i < particles.length; i++){
        if(p == particles[i]){
          particles.splice(i, 1);
        }
      }
    }

    p.x = p.x + p.xV;
    p.y = p.y + p.yV;
    p.o = p.o + p.oV;
    p.z = p.z + p.zV;
    p.zV = p.zV - p.gravity

    p.scale = p.scale + p.scaleV;

    p.xR = p.xR + p.xRv;
    p.zR = p.zR + p.zRv;
    p.yR = p.yR + p.yRv;
    p.el.css("transform","translate3d("+p.x+"px,"+p.y+"px,"+p.z+"px) rotateX("+p.xR+"deg) rotateZ("+p.zR+"deg) rotateY("+p.yR+"deg) scale("+p.scale+")");
    p.el.css("opacity",p.o);
  }

  particles.push(particle);
  particle.el.css("opacity",0);

  $(".board").append(particle.el);
}

function getRandom(min, max){
  return min + Math.random() * (max-min);
}


//Laser Beam
function makeBeam(x,y,direction, color){

  console.log(x,y,direction,color);
  var snakeX = x * 20; // starting point
  var snakeY = y * 20; //starting point

  if(direction == "left") {
    var width = (game.width - (game.width - x) + 1) * 20;
    var height = 20;
    y = snakeY;
    x = 0;
  }

  if(direction == "right") {
    var width = (game.width - x) * 20;
    var height = 20;
    y = snakeY;
    x = snakeX;
  }

  if(direction == "up") {
    var width = 20;
    var height = (game.height - (game.height - y) ) * 20;
    y = 0;
    x = snakeX;
  }

  if(direction == "down") {
    var width = 20;
    var height = (game.height - y ) * 20;
    y = snakeY;
    x = snakeX;
  }

  var particle = {};
  particle.el = $("<div class='beam'><div class='body'/></div>");
  particle.el.find(".body").css("background",color);
  particle.el.css("height", height);
  particle.el.css("width", width);
  particle.el.css("transform","translate3d("+x+"px,"+y+"px,0)");

  setTimeout(function(el) {
    return function(){
      el.remove();
    };
  }(particle.el),200);

  $(".border, .leader").removeClass("shake").width($(".border").width());
  $(".border, .leader").addClass("shake");
  $(".board").append(particle.el);
}


// Adds a bomb to the board at x,y
function makeExplosion(xPos, yPos){
  console.log("makeExplosion at ", xPos,yPos);

  playSound("boom");

  var size = 3;
  var width = 3 * 20;
  var offset = (width - 20) / 2;
  var x = xPos * 20 - offset;
  var y = yPos * 20 - offset;

  $(".border, .leader").addClass("shake");
  $(".border").one("animationend",function(){
    $(".border, .leader").removeClass("shake");
  })

  var particle = {};
  particle.el = $("<div class='boom'><div class='shock'/><div class='body'/></div>");
  particle.el.css("height", width);
  particle.el.css("width", width);
  particle.el.css("transform","translate3d("+x+"px,"+y+"px,0)");

  setTimeout(function(el) {
    return function(){
      el.remove();
    };
  }(particle.el),500);

  //Move function
  $(".board").append(particle.el);

  // Make Bomb Puffs
  for(var i = 0; i < 8; i++){

    var options = {
      x : xPos * 20,     // absolute non-relative position on gameboard
      y : yPos * 20,     // absolute non-relative position on gameboard
      angle: getRandom(0,359),    // just on the x,y plane, works with speed
      zR : getRandom(-15,15),     // zRotation velocity
      oV : -.008,                 // opacity velocity
      width : getRandom(20,55),   // size of the particle
      className : 'puff',         // adds this class to the particle <div/>
      lifespan: 125,              // how many frames it lives
    }

    // Need to put this offset code into the makeParticle function
    // You should pass it an x,y of 0

    var offset = (options.width - 20) / 2;
    options.x = options.x - offset;
    options.y = options.y - offset;
    options.height = options.width;
    options.speed = 1 + (2 * (1 - options.width / 50)); // The bigger the particle, the lower the speed

    makeParticle(options);
  }
}


function makeSpawnParticle(xPos, yPos, color){

  var size = 1;
  var width = size * 20;
  var offset = (width - 20) / 2;
  var x = xPos * 20 - offset;
  var y = yPos * 20 - offset;

  var particle = {};
  particle.el = $("<div class='spawn'><div class='body'/></div>");
  particle.el.css("height", width);
  particle.el.css("width", width);
  particle.el.find(".body").css("border-color", color);
  particle.el.css("transform","translate3d("+x+"px,"+y+"px,0)");

  setTimeout(function(el) {
    return function(){
      el.remove();
    };
  }(particle.el),2000);

  //Move function
  $(".board").append(particle.el);




}



function makeSmear(x, y){

  // Make Bomb blasts
  for(var i = 0; i < 12; i++){
    var options = {
      x : x + 8,
      y : y + 8,
      zR : getRandom(0,360),
      width: 4,
      height: getRandom(60,100),
      className : 'smear',
      lifespan: 200,
      color: "linear-gradient(white,rgba(0,0,0,0)",
      o: .4,
      oV: -.01
    }
    makeParticle(options);
  }

  // Adds a dark patch over the blast marks above...

  var options = {
    x : x - 10,     // absolute non-relative position on gameboard
    y : y - 10,     // absolute non-relative position on gameboard
    width: 40,
    height: 40,
    className : 'cover',         // adds this class to the particle <div/>
    lifespan: 200,              // how many frames it lives
  }
  makeParticle(options);

}