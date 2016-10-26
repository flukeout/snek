// This is the Chatting UI at the bottom of the screen
// It's also used to change your name.

var chat = {
  state : "closed",   // Is the chatting UI open or closed
  mode : "",          // There are two modes, one for chatting, one for changing your name
  chatUI: "",         // Placeholder for chat UI wrapper element
  chatInput : "",     // Placeholder for input element

  // Sets up references to the UI elements
  init : function(){
    this.chatUI = $(".chat-ui");
    this.chatInput = this.chatUI.find("input");
  },

  // Open the name change key
  changeNameKeyHit: function(){
    if(this.state == "closed"){
      this.startTyping();
      this.state = "open";
      this.chatInput.attr("placeholder","What's your name?");
      this.mode = "namechange";
    }
  },

  // Opens the chat UI
  startTyping: function(){
    $(".keys-helper").hide();
    this.chatUI.show();
    var that = this;
    setTimeout(function(){
      that.chatInput.focus();
    },20)
  },

  // When a player hits Enter
  enterHit : function(){
    if(this.state == "closed") {
      this.startTyping();
      this.state = "open";
      this.mode = "chatmessage";
      this.chatInput.attr("placeholder","Send a message");
    } else {
      this.state = "closed";
      this.finishTyping();
    }
  },

  // When a player finishes typing (via pressing Enter) we either
  // send a chage message or change the player's name, depending on the mode.
  finishTyping: function(){
    $(".keys-helper").show();
    this.chatUI.hide();
    var inputVal = this.chatInput.val();
    this.chatInput.val("");
    this.chatInput.blur();

    if(this.mode == "namechange") {
      newName = inputVal.trim();
      this.changeName(newName);
    }

    if(this.mode == "chatmessage" && inputVal.length > 0) {
      this.sendMessage(inputVal);
    }
  },

  // Send a name change event to the server
  // Limits the name to 12 characters
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

  // Send a chat message to the server
  // Limits chat message to 32 characters
  sendMessage: function(message){
    if(message.length > 32) {
      message = message.substring(0,32) + "...";
    }
    socket.emit('sendChat', {
      message: message
    });
  }
};
