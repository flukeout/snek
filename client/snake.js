function makeSnake(id, x, y, color, direction, length){
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
    name : "Snakeman",
    points : 0,
    length: length,
    moving : false,
    color : color,
    speed : 5, // every 10 frames?
    segments : [],
    changes : [],
    phrases : ["ow","T_T","No!","Damn",'ahh',"!!?","wut", "u wot","fek","why??","BS","GG","l8r","lame"],
    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
      makeSpawnParticle(x, y, this.color);
    },
    getHead : function(){
      return this.segments[this.segments.length -1];
    },
    say : function(message){
      // For displaying chat messages
      var head = this.getHead();
      var messageEl = $("<div class='message'><div class='body'>"+message+"</div></div>");
      $(".board").append(messageEl);

      var position = head.el.position();
      messageEl.css("transform","translateX("+head.x * 20+"px) translateY("+head.y*20+"px)");
      messageEl.find(".body").css("color",this.color);

      setTimeout(function(el) {
        return function() {
          el.remove();
        };
      }(messageEl), 1500);

    },
    makeSegment : function(x,y,place){
      var segmentEl = $("<div class='snek'><div class='body'></div></div>");

      var segmentDetails = {
        x : x | 0,
        y : y | 0,
        el : segmentEl
      }

      $(".board").append(segmentEl);
      segmentEl.css("opacity",0);

      segmentEl.css("width",this.size).css("height",this.size);
      segmentEl.find(".body").css("background",this.color);

      if(place == "tail") {
        this.segments.splice(0, 0, segmentDetails);
      } else {
        this.segments.push(segmentDetails);
      }
    },
    eat : function(){
      playSound("eat");
    },
    move : function(){
      this.draw();
    },
    die : function(x,y,type){

      // Say something
      var that = this;
      setTimeout(function(){
        var index = parseInt(getRandom(0,that.phrases.length));
        that.say(that.phrases[index]);
      },220);

      // Make an explosion
      if(type != "quiet"){


        for(var i = 0; i < 8; i++){

          var options = {
            x : x * this.size,     // absolute non-relative position on gameboard
            y : y * this.size,     // absolute non-relative position on gameboard
            angle: getRandom(0,359),    // just on the x,y plane, works with speed
            zR : getRandom(-15,15),     // zRotation velocity
            oV : -.008,                 // opacity velocity
            width : getRandom(20,55),   // size of the particle
            className : 'puff',         // adds this class to the particle <div/>
            lifespan: 125,              // how many frames it lives
          }

          // Need to put this offset code into the makeParticle function
          // You should pass it an x,y of 0

          var offset = (options.width - this.size) / 2;
          options.x = options.x - offset;
          options.y = options.y - offset;
          options.height = options.width;
          options.speed = 1 + (2 * (1 - options.width / 50)); // The bigger the particle, the lower the speed

          makeParticle(options);
        }

        // UGH GRHOSS
        makeAnimParticle(x, y);
      }

      for(var i = 0; i < this.segments.length; i++){
        var seg = this.segments[i];
        seg.el.remove();
      }
      var snakeIndex = game.snakes.indexOf(this);
      game.snakes.splice(snakeIndex, 1);
    },
    boom : function(){
      var head = this.segments[this.segments.length - 1];
      makeBeam(head.x, head.y, this.direction || "left", this.color);
    },
    removeSegment : function(segment){
      // This removes the element and the segment from the array;
      var segmentIndex = this.segments.indexOf(segment);
      var el = segment.el;
      el.remove();
      this.segments.splice(segmentIndex,1);
    },
    loseSegment: function(x, y, showParticle, position) {

      if(this.segments.length > 1) {
        if(position == "head") {
          var segment = this.segments[this.segments.length - 1];
          segment.el.removeClass("gone").width(segment.el.width());
          segment.el.addClass("gone");
        }
      }

      playSound("bonk");

      if(showParticle || false) {
        var options = {
          x : x * this.size,
          y : y * this.size,
          angle : getRandom(0,359),
          speed : getRandom(0,2),
          // Ideas for random or range
          // speed : { range:  [0,10] },  // Picks random from 0 to 10
          // speed : { random: [0,10] },  // Picks random value in array. 0 or 10
          // speed : 10,                  // Sets speed to 10
          zV : getRandom(5,10),
          xRv : getRandom(0,3),
          yRv : getRandom(0,3),
          zRv : getRandom(0,3),
          gravity : .4,
          // oV : -.02,
          lifespan : getRandom(15,18),
          color: this.color,
        }
        makeParticle(options);
      }

    },
    loseHead : function(){
      var head = this.segments[this.segments.length - 1];
      this.loseSegment(head.x,head.y,true, "head")
    },
    draw : function(){
      for(var i = 0; i < this.segments.length; i++) {
        var seg = this.segments[i];
        $(seg.el).css("opacity", 1);
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}
