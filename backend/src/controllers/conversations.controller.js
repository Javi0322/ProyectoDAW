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

module.exports = { listConversations };
