const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { postMessage } = require("../controllers/assistant.controller");

const router = express.Router();

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, please try again later" },
});

router.post("/", requireAuth, requireRole("ADMIN", "SUPERVISOR"), assistantLimiter, postMessage);

module.exports = router;
