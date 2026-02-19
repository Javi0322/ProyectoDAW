const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { listConversations } = require("../controllers/conversations.controller");

const router = express.Router();

router.get("/", requireAuth, listConversations);

module.exports = router;
