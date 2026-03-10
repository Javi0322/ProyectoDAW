const crypto = require("crypto");

function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireWebhookSecret(req, res, next) {
  const secret = req.header("X-Webhook-Secret");

  if (!secret) {
    return res.status(401).json({
      ok: false,
      error: "missing credentials",
    });
  }

  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    return res.status(403).json({
      ok: false,
      error: "invalid credentials",
    });
  }

  next();
}

module.exports = { requireWebhookSecret };