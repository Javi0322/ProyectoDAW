require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const meRoutes = require("./routes/me.routes");
const webhooksRoutes = require("./routes/webhooks.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const usersRoutes = require("./routes/users.routes");
const http = require("http");
const { Server } = require("socket.io");
const { setSocketServer } = require("./socket");
const jwt = require("jsonwebtoken");
const { prisma } = require("./prisma/client");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
const jsonStrict = express.json({ limit: '64kb' });
const jsonWebhook = express.json({ limit: '1mb' });

app.use("/auth", jsonStrict, authRoutes);
app.use("/me", jsonStrict, meRoutes);
app.use("/webhooks", jsonWebhook, webhooksRoutes);
app.use("/conversations", jsonStrict, conversationsRoutes);
app.use("/users", jsonStrict, usersRoutes);


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

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });

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

  socket.join(`user:${userId}`);
  socket.join(`role:${userRole}`);

  socket.on("conversation:join", async (conversationId) => {
    const id = Number(conversationId);
    if (!Number.isInteger(id) || id <= 0) return;

    const { role } = socket.user;
    const userId = Number(socket.user.id);

    if (role === "ADMIN" || role === "SUPERVISOR") {
      socket.join(`conversation:${id}`);
      console.log(`socket ${userId} joined conversation:${id}`);
      return;
    }

    // AGENT: only assigned-to-them or unassigned conversations
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: { assignedToId: true },
      });

      if (!conversation) return;

      if (conversation.assignedToId === null || conversation.assignedToId === userId) {
        socket.join(`conversation:${id}`);
        console.log(`socket ${userId} joined conversation:${id}`);
      }
    } catch {
      // ignore — do not expose internal errors to the client
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    const room = `conversation:${conversationId}`;
    socket.leave(room);
    console.log(`socket ${socket.user.id} left ${room}`);
  });

  socket.on("disconnect", () => {
      console.log(`socket disconnected, UserId ${userId} - Role ${userRole}`);

  });
});


server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
