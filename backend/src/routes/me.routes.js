const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { getMe } = require("../controllers/me.controller");

const router = express.Router();

router.get("/", requireAuth, getMe);

module.exports = router;
