const { askAssistant } = require("../services/assistant.service");

async function postMessage(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ ok: false, error: "message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ ok: false, error: "message too long (max 500 chars)" });
    }

    const cleanHistory = Array.isArray(history)
      ? history
          .filter(t => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
          .map(t => ({ role: t.role, content: t.content.slice(0, 500), sql: t.sql ?? null }))
      : [];

    const t0 = Date.now();
    const { answer, sql } = await askAssistant(message.trim(), cleanHistory);
    const ms = Date.now() - t0;
    console.log(`[assistant] "${message.trim().slice(0, 60)}" → ${ms}ms`);

    return res.json({ ok: true, answer, sql, ms });
  } catch (err) {
    if (err.code === "INVALID_SQL" || err.code === "SQL_EXEC_ERROR") {
      return res.status(422).json({ ok: false, error: err.message });
    }
    if (err.code === "RUNPOD_UNAVAILABLE") {
      return res.status(503).json({ ok: false, error: "El servicio IA no está disponible ahora mismo" });
    }
    console.error("assistant controller error:", err);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
}

module.exports = { postMessage };
