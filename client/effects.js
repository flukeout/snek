
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

  var options = {
    x : xPos * 20 - 190,
    y : yPos * 20 - 190,
    width : 400,
    height: 400,
    o : .1,
    oV : -.002,
    className : "underblast",
    lifespan: 125,
    scale : 1,
    scaleV : -.01,
    color: "radial-gradient(white 10%, rgba(255,255,255,0) 50%)",
  }
  makeParticle(options);
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
