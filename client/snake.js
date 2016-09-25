function makeSnake(id, x, y, color, direction, length, name){
  var snek = {
    x : x,
    y : y,
    id : id,
    size : 20,
    name : name,
    points : 0,
    length: length,
    moving : false,
    color : color,
    speed : 5, // every 10 frames?
    segments : [],
    changes : [],
    phrases : [
      "!!?",
      "abort!",
      "ahh",
      "aww",
      "brb",
      "but...",
      "come on",
      "damn",
      "fek",
      "fuuuuuu",
      "gah!",
      "gg",
      "how?",
      "l8r",
      "lag",
      "no!",
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
        makeSmear(x * game.size,y * game.size);
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
        $(seg.el).css("transform","translateX(" + seg.x * this.size + "px) translateY(" + seg.y * this.size + "px)");
      }
    }
  }
  return snek;
}
