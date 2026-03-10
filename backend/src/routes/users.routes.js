const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { listUsers, createUser, updateUser, deleteUser } = require("../controllers/users.controller");

const router = express.Router();

router.get("/",      requireAuth, listUsers);
router.post("/",     requireAuth, createUser);
router.patch("/:id", requireAuth, updateUser);
router.delete("/:id", requireAuth, deleteUser);

module.exports = router;
