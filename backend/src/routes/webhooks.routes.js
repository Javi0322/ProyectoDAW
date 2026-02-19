const express = require("express");
const { providerWebhook } = require("../controllers/webhooks.controller");

const router = express.Router();

router.post("/provider", providerWebhook);

module.exports = router;
