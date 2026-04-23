const { prisma } = require("../prisma/client");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

async function getLabels(req, res) {
  const labels = await prisma.label.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  return res.json({ ok: true, labels });
}

async function createLabel(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const name  = String(req.body.name  || "").trim();
  const color = String(req.body.color || "").trim();

  if (!name || !color) {
    return res.status(400).json({ ok: false, error: "name and color are required" });
  }

  if (!HEX_COLOR.test(color)) {
    return res.status(400).json({ ok: false, error: "color must be a valid hex color (e.g. #f59e0b)" });
  }

  const existing = await prisma.label.findUnique({ where: { name } });
  if (existing) {
    return res.status(409).json({ ok: false, error: "label name already in use" });
  }

  const label = await prisma.label.create({
    data: { name, color },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  return res.status(201).json({ ok: true, label });
}

async function updateLabel(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const labelId = Number(req.params.id);
  if (!labelId) {
    return res.status(400).json({ ok: false, error: "invalid label id" });
  }

  const data = {};
  if (req.body.name  !== undefined) data.name  = String(req.body.name).trim();
  if (req.body.color !== undefined) data.color = String(req.body.color).trim();

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ ok: false, error: "nothing to update" });
  }

  if (data.color && !HEX_COLOR.test(data.color)) {
    return res.status(400).json({ ok: false, error: "color must be a valid hex color (e.g. #f59e0b)" });
  }

  const existing = await prisma.label.findUnique({ where: { id: labelId } });
  if (!existing || !existing.active) {
    return res.status(404).json({ ok: false, error: "label not found" });
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.label.findUnique({ where: { name: data.name } });
    if (nameTaken) {
      return res.status(409).json({ ok: false, error: "label name already in use" });
    }
  }

  const label = await prisma.label.update({
    where: { id: labelId },
    data,
    select: { id: true, name: true, color: true, createdAt: true },
  });

  return res.json({ ok: true, label });
}

async function deleteLabel(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const labelId = Number(req.params.id);
  if (!labelId) {
    return res.status(400).json({ ok: false, error: "invalid label id" });
  }

  const existing = await prisma.label.findUnique({ where: { id: labelId } });
  if (!existing || !existing.active) {
    return res.status(404).json({ ok: false, error: "label not found" });
  }

  await prisma.$transaction([
    prisma.conversationLabel.deleteMany({ where: { labelId } }),
    prisma.label.update({ where: { id: labelId }, data: { active: false } }),
  ]);

  return res.json({ ok: true });
}

module.exports = { getLabels, createLabel, updateLabel, deleteLabel };
