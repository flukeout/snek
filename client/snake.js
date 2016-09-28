function makeSnake(id, x, y, color, direction, length, name){
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
    name : name,
    length: length,
    moving : false,
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
    },

    getHead : function(){
      return this.segments[this.segments.length -1];
    },

    loadWarp : function(segments){
      this.upcomingWarp = segments;
    },

    warp : function(segments) {

      for(var i = 0; i < segments.length; i++){
        var segment = segments[i];

        var options = {
          x : segment.x * this.size + 1,
          y : segment.y * this.size + 1,
          width: 18,
          height: 18,
          color: this.color,
          o: .4,
          oV: -0.005,
          lifespan : 300,
          className : "warpskid",
        }
        makeParticle(options);
      } // for each warp segments
    },

    say : function(message){
      // Appends a chat message element at the head position

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
      if(this.upcomingWarp){
        this.warp(this.upcomingWarp);
        this.upcomingWarp = false;
      }
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

      for(var i = 0; i < this.segments.length; i++) {
        var seg = this.segments[i];
        $(seg.el).css("opacity", 1);
        if(this.id == game.playerId){
          $(seg.el).addClass("player-snake");
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
