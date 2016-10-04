function makeSnake(id, x, y, color, direction, length, name){
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
    name : name,
    length: length,
    moving : false,
    charge : 0,
    boostCharge : 12,
    color : color,
    segments : [],
    upcomingWarp : false,
    phrases : [
      "...",
      "!!?",
      "abort!",
      "ack",
      "ahh",
      "aww",
      "aw man",
      "brb",
      "but...",
      "come on",
      "damn",
      "dang",
      "fek",
      "fuuuuuu",
      "gah!",
      "gg",
      "how?",
      "l8r",
      "lag",
      "no!",
      "oops",
      "ouch",
      "ow",
      "o_o",
      "peace",
      "T_T",
      "why??",
      "wut"
    ],

    init : function(){
      for(var i = 0; i < this.length; i++) {
        this.makeSegment(this.x,this.y,"head");
      }
      makeSpawnParticle(x, y, this.color);
      this.say(this.name);
      playSound("spawn");
    },

    getHead : function(){
      return this.segments[this.segments.length -1];
    },

    loadWarp : function(segments){
      this.upcomingWarp = segments;
    },

    warp : function(segments) {
      playSound("warp");

      for(var i = 0; i < this.segments.length; i++){
        var seg = {};
        var s = this.segments[i];
        seg.x = parseInt(s.x);
        seg.y = parseInt(s.y);
        segments.push(seg)
      }

      for(var i = 0; i < segments.length; i++){
        var segment = segments[i];
        var options = {
          x : segment.x * this.size + 1,
          y : segment.y * this.size + 1,
          width: 18,
          height: 18,
          color: this.color,
          o: .4,
          // scale : .5 + (.5 * (i/segments.length)),
          oV: -0.005,
          lifespan : 300,
          className : "warpskid",
        }
        makeParticle(options);
      }

      // Detect if snake warped through a wall
      for(var i = 0; i < segments.length; i++ ) {
        var thisSeg = segments[i];
        if(i > 0 && i < segments.length - 1) {
          nextSeg = segments[i+1];
          var deltaX = thisSeg.x - nextSeg.x;
          var deltaY = thisSeg.y - nextSeg.y;
          if(Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {

            $(".border").css("border-color",this.color);


            // Make two particles to cover up the border where the warp happened
            var options = {
              x : thisSeg.x * this.size,
              y : thisSeg.y * this.size,
              width: 20,
              height: 20,
              speed : 2,
              o : .8,
              oV : -.005,
              color: "#000",
              lifespan : 150,
              className : "overlay"
            }
            makeParticle(options);

            options.x= nextSeg.x * this.size;
            options.y= nextSeg.y * this.size;
            makeParticle(options);

            // Flash the border according to the snake
            setTimeout(function(){
              $(".border").css("transition","border-color .25s ease-out");
              $(".border").css("border-color","");
            },250);
          }
        }
      }

      // Fluffs....
      var head = this.getHead();

      for(var j = 0; j < this.segments.length; j++) {
        var seg = this.segments[j];
        for(var i = 0; i < 2; i++){
          var options = {
            x : seg.x * this.size + getRandom(0,14),
            y : seg.y * this.size + getRandom(0,14),
            zV : getRandom(3,5),
            gravity : .15,
            width: 6,
            height: 6,
            speed : 2,
            color: this.color,
            o: 2,
            oV: -0.05,
            lifespan : 200,
            className : "speed"
          }

          if(this.direction == "right") {
            options.angle = 90;
          } else if(this.direction == "up") {
            options.angle = 180;
          } else if(this.direction == "left") {
            options.angle = 270;
          } else if(this.direction == "down") {
            options.angle = .01;
          }

          makeParticle(options);
      }

      }
    },

      // Appends a chat message element at the head position
    say : function(message){


      // Remove any other messages with this snake ID
      $(".message[snake="+this.id+"]").remove();

      var head = this.getHead();

      // Include the snake id in the message
      var messageEl = $("<div snake='" + this.id + "' class='message'><div class='body'>"+message+"</div></div>");

      var position = head.el.position();
      messageEl.css("transform","translateX("+head.x * 20+"px) translateY("+head.y*20+"px)");
      messageEl.find(".body").css("color",this.color);
      $(".board").append(messageEl);

      setTimeout(function(el) {
        return function() {
          el.remove();
        };
      }(messageEl), 2750);
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
      if(this.upcomingWarp){
        this.warp(this.upcomingWarp);
        this.upcomingWarp = false;
      }
      this.draw();
    },

    die : function(x,y,type){

      if(type != "quiet"){
        // Death cry!
        var that = this;
        setTimeout(function(){
          var index = parseInt(getRandom(0,that.phrases.length));
          that.say(that.phrases[index]);
        },220);
        // Make an explosion!
        makeExplosion(x, y);
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

      if(showParticle || false) {
        playSound("bonk");
        var options = {
          x : x * this.size,
          y : y * this.size,
          angle : getRandom(0,359),
          speed : getRandom(0,2),
          zV : getRandom(5,10),
          xRv : getRandom(0,3),
          yRv : getRandom(0,3),
          zRv : getRandom(0,3),
          gravity : .4,
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

      // we ahve access to the charge level here (this.charge)....!
      if(this.id == game.playerId){
        if(this.charge == this.boostCharge) {
          playSound("power-up");
        }
      }

      for(var i = 0; i < this.segments.length; i++) {
        var seg = this.segments[i];
        $(seg.el).css("opacity", 1);
        if(this.id == game.playerId){
          $(seg.el).addClass("player-snake");

          if(this.charge >= this.boostCharge) {
            $(seg.el).addClass("charged");
          } else {
            $(seg.el).removeClass("charged");
          }

        } else {
          $(seg.el).removeClass("player-snake");
        }
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
        if(!this.moving && i == 0) {
          $(seg.el).addClass("not-moving");
        } else {
          $(seg.el).removeClass("not-moving");
        }
      }
    }
  }
  return snek;
}
