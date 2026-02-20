const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { listConversations, assignToMe, assign  } = require("../controllers/conversations.controller");

const router = express.Router();

router.get("/", requireAuth, listConversations);
router.post("/:id/assign-to-me", requireAuth, assignToMe);
router.post("/:id/assign", requireAuth, assign);

module.exports = router;
