var particles = [];         // Holds all particle objects
var blankParticles = [];    // Holdes reference to pre-appended particle elements
var maxParticleCount = 100; // Number of pre-appended particle divs

$(document).ready(function(){
  for(var i = 0; i < maxParticleCount; i++){
    var blankParticle = $("<div class='blank-particle'></div>");
    $(".board").append(blankParticle);
    blankParticles.push({
      active: false,
      el: blankParticle
    });
  }
});

// Makes a particle

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
    scaleVa : options.scaleVa || 0,

    speed : options.speed || false,
    angle : options.angle || false,

    color:  options.color || false,
    width : options.width || 20,
    height: options.height || 20,

    gravity : options.gravity || 0,

    className : options.className || false,

    lifespan : options.lifespan || 0,
    delay : options.delay || 0, //how long to wait before moving
  };


  if(particle.angle) {
    particle.angle =  particle.angle - 180;
    particle.xV = Math.sin(particle.angle * (Math.PI/180)) * particle.speed;
    particle.yV = Math.cos(particle.angle * (Math.PI/180)) * particle.speed;
  }

  for(var i = 0; i < blankParticles.length; i++){
    var blankParticle = blankParticles[i];
    if(blankParticle.active == false) {
      blankParticle.active = true;
      particle.referenceParticle = blankParticle;
      particle.el = blankParticle.el;
      break;
    }
  }

  if(!particle.el){
    return;
  }

  // Grabs an available particle from the blankParticles array
  particle.referenceParticle = blankParticle;

  particle.el.css("height", particle.height);
  particle.el.css("width",  particle.width);
  particle.el.addClass(particle.className);
  particle.el.css("background",particle.color);

  particle.move = function(){
    var p = this;

    if(p.delay > 0) {
      p.delay--;
      return;
    }

    p.lifespan--;

    if(p.lifespan < 0) {
      p.referenceParticle.active = false;
      p.el.removeAttr("style");
      p.el.removeClass(p.className);
      p.el.hide();

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
    p.scaleV = p.scaleV + p.scaleVa;

    p.xR = p.xR + p.xRv;
    p.zR = p.zR + p.zRv;
    p.yR = p.yR + p.yRv;
    p.el.css("transform","translate3d("+p.x+"px,"+p.y+"px,"+p.z+"px) rotateX("+p.xR+"deg) rotateZ("+p.zR+"deg) rotateY("+p.yR+"deg) scale("+p.scale+")");
    p.el.css("opacity",p.o);

  } // particle.move()

  particles.push(particle);
  particle.el.css("display","block");
  particle.el.css("opacity",0);
}


// Shakes the UI elements on the screen
function shakeScreen(){

  var border = $(".border, .leader, .keys-helper");

  border.each(function(index,el){

    var styleTag = $("<style type='text/css'>* {background: pink;}</style>");
    $("head").append(styleTag);

    styleTag.html(`
      @keyframes shake-`+index+` {
        0% {
          transform: translateX(`+ getRandom(-20,-10)+ `px) translateY(`+ getRandom(-20,-10)+ `px);
        }
        25% {
          transform: translateX(`+ getRandom(10,15)+ `px) translateY(`+ getRandom(10,15)+ `px) rotate(`+getRandom(1,4)+`deg);
        }
        50% {
          transform: translateX(`+ getRandom(-10,-5)+ `px) translateY(`+ getRandom(-10,-5)+ `px);
        }
        75% {
          transform: translateX(`+ getRandom(5,10)+ `px) translateY(`+ getRandom(5,10)+ `px) rotate(`+getRandom(-1,-3)+`deg);
        }
      }
    `);

    $(el).css("animation","shake-" + index + " .2s ease-out");

    setTimeout(function(styleTag,shakeEl) {
      return function(){
        styleTag.remove();
        $(shakeEl).css("animation","");
      };
    }(styleTag,el),200);

  });
}

// Adds a bomb to the board at x,y
function makeExplosion(xPos, yPos){

  playSound("boom");
  shakeScreen();

  var size = 3;
  var width = 3 * 20;
  var offset = (width - 20) / 2;
  var x = xPos * 20 - offset;
  var y = yPos * 20 - offset;

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


  // Bomb blasts that eminate from the center of the bomb
  for(var i = 0; i < getRandom(8,12); i++){
    var options = {
      x : (xPos * 20) + 8,
      y : (yPos * 20) + 8,
      zR : getRandom(0,360),
      width: 4,
      height: getRandom(60,100),
      className : 'smear',
      lifespan: 200,
      o: .4,
      oV: -.01
    }

    var percentage = 100 * 15 / options.height; // Percent along blast line where the white should start.
    options.color = "linear-gradient(rgba(0,0,0,0) "+percentage+"%, rgba(255,255,255,.6) "+ percentage + 3 +"%, rgba(255,255,255,.6) 60%, rgba(0,0,0,0)";
    makeParticle(options);
  }

}

// Adds effect to a newly spawned snake
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

  $(".board").append(particle.el);
}


function getRandom(min, max){
  return min + Math.random() * (max-min);
}
