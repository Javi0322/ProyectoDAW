const crypto = require("crypto");

function safeCompare(a, b) {
  const hashA = crypto.createHmac('sha256', 'compare').update(a).digest();
  const hashB = crypto.createHmac('sha256', 'compare').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
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