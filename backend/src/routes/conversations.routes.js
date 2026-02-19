const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { listConversations, assignToMe } = require("../controllers/conversations.controller");

const router = express.Router();

router.get("/", requireAuth, listConversations);
router.post("/:id/assign-to-me", requireAuth, assignToMe);

module.exports = router;
