const { getSocketServer } = require("../socket");

function emitToConversationAudience(eventName, payload) {
  const io = getSocketServer();
  const { conversation } = payload;
  console.log(conversation);
  if (conversation.assignedToId === null) {
    io.to("role:AGENT").emit(eventName, payload);
    io.to("role:SUPERVISOR").emit(eventName, payload);
    io.to("role:ADMIN").emit(eventName, payload);
    console.log(`Evento ${eventName} emitido al websocket a todos`)
    return;
  }

  io.to(`user:${conversation.assignedToId}`).emit(eventName, payload);
  io.to("role:SUPERVISOR").emit(eventName, payload);
  io.to("role:ADMIN").emit(eventName, payload);
  console.log(`Evento ${eventName} emitido al websocket con restricciones`)
}


module.exports = {
  emitToConversationAudience
};