require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const meRoutes = require("./routes/me.routes");
const webhooksRoutes = require("./routes/webhooks.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const http = require("http");
const { Server } = require("socket.io");
const { setSocketServer } = require("./socket");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/webhooks", webhooksRoutes);
app.use("/conversations", conversationsRoutes);


// Ruta de prueba
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API running" });
});


const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
});

setSocketServer(io);


io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("unauthorized"));
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    socket.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (err) {
    next(new Error("unauthorized"));
  }
});


io.on("connection", (socket) => {
  const userId = socket.user.id;
  const userRole = socket.user.role;

  console.log(`socket connected, UserId ${userId} - Role ${userRole}`);

  // room del usuario
  socket.join(`user:${userId}`);
  socket.join(`role:${userRole}`);

  socket.on("disconnect", () => {
    console.log(`socket disconnected, UserId ${userId} - Role ${userRole}`);
  });
});


server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
