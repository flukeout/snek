var particles = [];

function makeParticle(xPos, yPos, speed, angle, color){

  var particle = {
    x : xPos,
    y : yPos,
    z : 0,
    width : 20,
    height: 20,
    yV : 0,
    xV : 0,
    zV : getRandom(5,10),
    gravity : .4,
    xR : 0,
    xRv : getRandom(0,3),
    yR : 0,
    yRv : getRandom(0,3),
    zR : 0,
    zRv : getRandom(-20,20),
    o : 1,
    oV : -.0,
    scale : 1,
    scaleV : -.02,
    lifespan : 25,
  };

  particle.xV = getRandom(-3,3);
  particle.yV = getRandom(-3,3);
  particle.el = $("<div class='particle'></div>");
  particle.el.css("height",particle.height);
  particle.el.css("width",particle.width);
  particle.el.css("background",color);

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
    // p.zR = p.zR + p.zRv;
    p.yR = p.yR + p.yRv;
    p.el.css("transform","translate3d("+p.x+"px,"+p.y+"px,"+p.z+"px) rotateX("+p.xR+"deg) rotateZ("+p.zR+"deg) rotateY("+p.yR+"deg) scale(1)");
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

  playSound("boom");

  setTimeout(function(el) {
    return function(){
      el.remove();
    };
  }(particle.el),200);

  $(".border, .leader").removeClass("shake").width($(".border").width());
  $(".border, .leader").addClass("shake");
  $(".board").append(particle.el);
}

function makeAnimParticle(xPos, yPos){
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
}

