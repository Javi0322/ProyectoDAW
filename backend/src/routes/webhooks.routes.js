const express = require("express");
const { providerWebhook } = require("../controllers/webhooks.controller");
const { requireWebhookSecret } = require("../middleware/webhook-auth.middleware");

const router = express.Router();

router.post("/provider", requireWebhookSecret, providerWebhook);

module.exports = router;
