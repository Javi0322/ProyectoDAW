const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth.middleware");

const sendMessageLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "too many messages, please slow down" },
});
const {
    listConversations,
    assignToMe,
    assign,
    unassign,
    getConversationMessages,
    sendMessage,
    getConversationById,
    updateConversationStatus,
    markConversationAsRead,
    updateContactName,
    addLabel,
    removeLabel,
  } = require("../controllers/conversations.controller");

const router = express.Router();

router.get("/", requireAuth, listConversations);
router.get("/:id", requireAuth, getConversationById);
router.post("/:id/assign-to-me", requireAuth, assignToMe);
router.post("/:id/assign", requireAuth, assign);
router.post("/:id/unassign", requireAuth, unassign);
router.get("/:id/messages", requireAuth, getConversationMessages);
router.post("/:id/messages", requireAuth, sendMessageLimiter, sendMessage);
router.patch("/:id/status", requireAuth, updateConversationStatus);
router.post("/:id/read", requireAuth, markConversationAsRead);
router.patch("/:id/contact", requireAuth, updateContactName);
router.post("/:id/labels", requireAuth, addLabel);
router.delete("/:id/labels/:labelId", requireAuth, removeLabel);

module.exports = router;
