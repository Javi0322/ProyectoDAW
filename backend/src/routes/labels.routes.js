const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { getLabels, createLabel, updateLabel, deleteLabel } = require("../controllers/labels.controller");

const router = express.Router();

router.get("/",       requireAuth, getLabels);
router.post("/",      requireAuth, createLabel);
router.patch("/:id",  requireAuth, updateLabel);
router.delete("/:id", requireAuth, deleteLabel);

module.exports = router;
