function requireWebhookSecret(req, res, next) {
  const secret = req.header("X-Webhook-Secret");

  if (!secret) {
    return res.status(401).json({
      ok: false,
      error: "missing credentials",
    });
  }

  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(403).json({
      ok: false,
      error: "invalid credentials",
    });
  }

  next();
}

module.exports = { requireWebhookSecret };