var chat = {
  state : "closed",
  init : function(){
    this.chatUI = $(".chat-ui");
    this.chatInput = this.chatUI.find("input");
  },
  chatUI: "",
  chatInput : "",
  enterHit : function(){
    if(this.state == "closed") {
      this.startType();
      this.state = "open";
    } else {
      this.state = "closed";
      this.finishType();
    }
  },
  startType: function(){
    $(".keys-helper").hide();
    this.chatUI.show();
    this.chatInput.focus();
  },
  finishType: function(){
    $(".keys-helper").show();
    this.chatUI.hide();
    var message = this.chatInput.val();
    this.chatInput.val("");
    this.chatInput.blur();
    if(message.length > 0) {
      this.sendMessage(message);
    }

  },
  sendMessage: function(message){
    socket.emit('sendChat', {
      message: message
    });
  }
};
