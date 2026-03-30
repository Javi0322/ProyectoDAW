const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { getStats, getUserConversations } = require("../controllers/stats.controller");

const router = express.Router();

router.get("/", requireAuth, requireRole('ADMIN', 'SUPERVISOR'), getStats);
router.get("/users/:userId/conversations", requireAuth, requireRole('ADMIN', 'SUPERVISOR'), getUserConversations);

module.exports = router;
