const { getSocketServer } = require("../socket");

function emitMessageNew({ conversationId, message }) {
  const io = getSocketServer();

  io.emit("message:new", {
    conversationId,
    message,
  });

  console.log("Evento message:new emitido al websocket");
}


function emitMessageUpdate({ conversationId, message }) {
  const io = getSocketServer();

  io.emit("message:state_update", {
    conversationId,
    message,
  });

  console.log("Evento message:state_update:"+ message.state + " emitido al websocket");
}

module.exports = {
  emitMessageNew,
  emitMessageUpdate
};