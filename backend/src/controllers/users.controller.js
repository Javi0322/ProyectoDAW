const { prisma } = require("../prisma/client");
const { hashPassword } = require("../services/password.service");

async function listUsers(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();

  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return res.json({ ok: true, users });
}

async function createUser(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();

  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const email     = String(req.body.email     || "").trim().toLowerCase();
  const password  = String(req.body.password  || "").trim();
  const firstName = String(req.body.firstName || "").trim();
  const lastName  = String(req.body.lastName  || "").trim();
  const newRole   = String(req.body.role      || "AGENT").trim().toUpperCase();

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ ok: false, error: "email, password, firstName and lastName are required" });
  }

  if (!["ADMIN", "SUPERVISOR", "AGENT"].includes(newRole)) {
    return res.status(400).json({ ok: false, error: "invalid role" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ ok: false, error: "email already in use" });
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, role: newRole },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, createdAt: true },
  });

  return res.status(201).json({ ok: true, user });
}

async function updateUser(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();

  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "invalid user id" });
  }

  const data = {};
  if (req.body.firstName) data.firstName = String(req.body.firstName).trim();
  if (req.body.lastName)  data.lastName  = String(req.body.lastName).trim();
  if (req.body.email)     data.email     = String(req.body.email).trim().toLowerCase();
  if (req.body.role) {
    const r = String(req.body.role).trim().toUpperCase();
    if (!["ADMIN", "SUPERVISOR", "AGENT"].includes(r)) {
      return res.status(400).json({ ok: false, error: "invalid role" });
    }
    data.role = r;
  }
  if (typeof req.body.active === "boolean") data.active = req.body.active;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ ok: false, error: "nothing to update" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, createdAt: true },
  });

  return res.json({ ok: true, user });
}

async function deleteUser(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();

  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "invalid user id" });
  }

  if (userId === Number(req.user.sub)) {
    return res.status(400).json({ ok: false, error: "cannot delete yourself" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ ok: false, error: "user not found" });
  }

  if (!user.active) {
    return res.status(409).json({ ok: false, error: "user already inactive" });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: false },
  });

  return res.json({ ok: true });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
