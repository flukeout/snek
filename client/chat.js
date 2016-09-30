var chat = {
  state : "closed",
  mode : "",
  init : function(){
    this.chatUI = $(".chat-ui");
    this.chatInput = this.chatUI.find("input");
  },
  chatUI: "",
  chatInput : "",

  changeNameKeyHit: function(){
    if(this.state == "closed"){
      this.startType();
      this.state = "open";
      this.chatInput.attr("placeholder","What's your name?");
      this.mode = "namechange";
    }
  },

  enterHit : function(){
    if(this.state == "closed") {
      this.startType();
      this.state = "open";
      this.mode = "chatmessage";
      this.chatInput.attr("placeholder","Send a message");
    } else {
      this.state = "closed";
      this.finishType();
    }
  },

  startType: function(){
    $(".keys-helper").hide();
    this.chatUI.show();
    var that = this;
    setTimeout(function(){
      that.chatInput.focus();
    },20)
  },

  finishType: function(){
    $(".keys-helper").show();
    this.chatUI.hide();
    var inputVal = this.chatInput.val();
    this.chatInput.val("");
    this.chatInput.blur();

    if(this.mode == "namechange") {
      newName = inputVal.trim();
      this.changeName(newName);
    }

    if(inputVal.indexOf("admin") == 0 && this.mode == "chatmessage") {
      var command = inputVal.replace("admin","");
      command = command.trim();
      this.sendAdminCommand(command);
      return;
    }

    if(this.mode == "chatmessage" && inputVal.length > 0) {
      this.sendMessage(inputVal);
    }
  },
  sendAdminCommand: function(command){
    socket.emit('adminCommand', {
      command: command
    });
  },
  changeName: function(newName){
    if(newName.length > 12) {
      newName = newName.substring(0,12) + "...";
    }
    localStorage.setItem("playerName",newName);
    socket.emit('changeName', {
      name: newName
    });
    this.sendMessage("Hi, I'm " + newName);
  },
  sendMessage: function(message){
    if(message.length > 32) {
      message = message.substring(0,32) + "...";
    }
    socket.emit('sendChat', {
      message: message
    });
  }
};
