const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { 
    listConversations, 
    assignToMe, 
    assign, 
    unassign, 
    getConversationMessages,
    sendMessage,
    getConversationById,
    updateConversationStatus,
    markConversationAsRead
  } = require("../controllers/conversations.controller");

const router = express.Router();

router.get("/", requireAuth, listConversations);
router.get("/:id", requireAuth, getConversationById);
router.post("/:id/assign-to-me", requireAuth, assignToMe);
router.post("/:id/assign", requireAuth, assign);
router.post("/:id/unassign", requireAuth, unassign);
router.get("/:id/messages", requireAuth, getConversationMessages);
router.post("/:id/messages", requireAuth, sendMessage);
router.patch("/:id/status", requireAuth, updateConversationStatus);
router.post("/:id/read", requireAuth, markConversationAsRead);

module.exports = router;
