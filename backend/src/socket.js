let io = null;

function setSocketServer(ioInstance) {
  io = ioInstance;
}

function getSocketServer() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = {
  setSocketServer,
  getSocketServer,
};