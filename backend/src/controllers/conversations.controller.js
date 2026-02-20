const { prisma } = require("../prisma/client");

function parseIntOr(defaultValue, v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

async function listConversations(req, res) {
  const userId = Number(req.user.sub);
  const role = req.user.role; // "ADMIN" | "SUPERVISOR" | "AGENT"

  // scope: mine | unassigned | all
  const scope = String(req.query.scope || "mine");

  // status: OPEN | PENDING | CLOSED (si no viene, no filtra)
  const status = req.query.status ? String(req.query.status) : null;

  // paginación básica
  const page = parseIntOr(1, req.query.page);
  const pageSize = Math.min(parseIntOr(20, req.query.pageSize), 50);
  const skip = (page - 1) * pageSize;
  const take = pageSize;


  // where base
  const where = {};

  // filtro status si viene
  if (status) where.status = status;

  // permisos por rol + scope
  if (role === "AGENT") {
    if (scope === "unassigned") {
      where.assignedToId = null;
    } else {
      // mine por defecto
      where.assignedToId = userId;
    }
  } else {
    // SUPERVISOR o ADMIN
    if (scope === "mine") {
      where.assignedToId = userId;
    } else if (scope === "unassigned") {
      where.assignedToId = null;
    } else {
      // all: sin filtro extra
    }
  }

  const [total, items] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        externalId: true,
        status: true,
        assignedToId: true,
        lastMessageAt: true,
        lastMessageText: true,
        updatedAt: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    }),
  ]);

  return res.json({
    ok: true,
    page,
    pageSize,
    total,
    items,
  });
}

async function assignToMe(req, res) {
  const userId = Number(req.user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  // Agente: solo puede asignarse si está sin asignar
  if (role === "AGENT") {
    const updated = await prisma.conversation.updateMany({
      where: { id, assignedToId: null },
      data: { assignedToId: userId },
    });

    if (updated.count === 0) {
      return res.status(409).json({ ok: false, error: "already assigned" });
    }

    return res.json({ ok: true });
  }

  // Admin/Supervisor: se asigna sin condición (simple)
  await prisma.conversation.update({
    where: { id },
    data: { assignedToId: userId },
  });

  return res.json({ ok: true });
}

async function assign(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();
  const conversationId = Number(req.params.id);
  const targetUserId = Number(req.body.userId);

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }
  if (!targetUserId) {
    return res.status(400).json({ ok: false, error: "invalid userId" });
  }

  // Solo SUPERVISOR o ADMIN pueden asignar a otros
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  // Validar que el usuario destino existe y está activo
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, active: true, role: true },
  });

  if (!target || !target.active) {
    return res.status(404).json({ ok: false, error: "target user not found/active" });
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedToId: targetUserId },
  });

  return res.json({ ok: true });
}

module.exports = { listConversations, assignToMe, assign };
