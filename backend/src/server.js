require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const meRoutes = require("./routes/me.routes");
const webhooksRoutes = require("./routes/webhooks.routes");
const conversationsRoutes = require("./routes/conversations.routes");



const app = express();
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
