const express = require("express");
const rateLimit = require("express-rate-limit");
const { login } = require("../controllers/auth.controller");

const loginLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 3,
  message: { ok: false, error: "too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/login", loginLimiter, login);

module.exports = router;
