const { prisma } = require("../prisma/client");
const { sendWhatsAppMessage } = require("../services/message-provider.service");
const { emitToConversationAudience } = require("../services/realtime.service");

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
  const user = req.user;
  const userId = Number(user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  // Agente: solo puede asignarse si está sin asignar
  if (role === "AGENT") {
    
    try {
      const conversation = await prisma.conversation.update({
        where: { id, assignedToId: null },
        data: { assignedToId: userId },
      });

      emitToConversationAudience("conversation:assign", {conversation}, true);

    } catch (error) {
      return res.status(409).json({ ok: false, error: "already assigned" });
    }
    
    return res.json({ ok: true });
  }

  // Admin/Supervisor: se asigna sin condición (simple)
  const conversation = await prisma.conversation.update({
    where: { id },
    data: { assignedToId: userId },
  });

  emitToConversationAudience("conversation:assign", {conversation}, true );

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

async function unassign(req, res) {
  const role = String(req.user.role || "").trim().toUpperCase();
  const userId = Number(req.user.sub);
  const conversationId = Number(req.params.id);

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  // AGENT: solo si es suya
  if (role === "AGENT") {
    const updated = await prisma.conversation.updateMany({
      where: { id: conversationId, assignedToId: userId },
      data: { assignedToId: null },
    });

    if (updated.count === 0) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    return res.json({ ok: true });
  }

  // ADMIN / SUPERVISOR: desasignar cualquiera
  if (role === "ADMIN" || role === "SUPERVISOR") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: null },
    });

    return res.json({ ok: true });
  }

  return res.status(403).json({ ok: false, error: "forbidden" });
}

async function getConversationMessages(req, res) {
  const conversationId = Number(req.params.id);

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;

  const userId = Number(req.user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      assignedToId: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ ok: false, error: "conversation not found" });
  }

  // AGENT: solo si está asignada a él o si está sin asignar
  // ADMIN/SUPERVISOR: pueden ver cualquiera
  if (role === "AGENT") {
    const canAccess =
      conversation.assignedToId === null || conversation.assignedToId === userId;

    if (!canAccess) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor }
    }),
    orderBy: { occurredAt: "desc" },
    select: {
      id: true,
      externalId: true,
      direction: true,
      state: true,
      text: true,
      occurredAt: true,
      stateAt: true,
      createdAt: true,
    },
  });

  const hasMore = messages.length > limit;

  if (hasMore) {
    messages.pop();
  }

  messages.reverse();

  const nextCursor = hasMore ? messages[0].id : null;

  return res.json({ ok: true, hasMore, nextCursor, conversation, messages });
}

async function sendMessage(req, res) {
  const conversationId = Number(req.params.id);
  const userId = Number(req.user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();
  const text = String(req.body.text || "").trim();

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  if (!text) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      assignedToId: true,
      customerPhone: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ ok: false, error: "conversation not found" });
  }

  if (!conversation.customerPhone) {
    return res.status(400).json({
      ok: false,
      error: "conversation has no customer phone",
    });
  }

  // AGENT: solo puede enviar si la conversación está asignada a él
  // ADMIN / SUPERVISOR: pueden enviar en cualquiera
  if (role === "AGENT" && conversation.assignedToId !== userId) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  try {
    const providerResult = await sendWhatsAppMessage({
      to: conversation.customerPhone,
      text,
    });

    const providerMessage = providerResult.message;
    const externalId = providerMessage.id;
    const now = new Date();

    const message = await prisma.message.upsert({
            where: { externalId },
            update: {
              state : providerMessage.stateSlug,
              stateAt : now,
              text : providerMessage.text
            },
            create: {
              externalId : String(providerMessage.id),
              direction : 'OUT',
              state : providerMessage.stateSlug,
              text : providerMessage.text,
              occurredAt : now,
              stateAt : providerMessage.stateDate,
              conversationId: conversation.id,
            },
          });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: providerMessage.date ? new Date(providerMessage.date) : now,
        lastMessageText: providerMessage.text || text,
      },
    });

    return res.status(201).json({
      ok: true,
      message,
      providerMessage,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({
      ok: false,
      error: "failed to send message",
    });
  }
}

async function getConversationById(req, res) {
  const conversationId = Number(req.params.id);
  const userId = Number(req.user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      externalId: true,
      customerPhone: true,
      status: true,
      assignedToId: true,
      lastMessageAt: true,
      lastMessageText: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          active: true,
        },
      },
    },
  });

  if (!conversation) {
    return res.status(404).json({ ok: false, error: "conversation not found" });
  }

  // AGENT: solo si está asignada a él o si está sin asignar
  // ADMIN/SUPERVISOR: pueden ver cualquiera
  if (role === "AGENT") {
    const canAccess =
      conversation.assignedToId === null || conversation.assignedToId === userId;

    if (!canAccess) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
  }

  return res.json({
    ok: true,
    conversation,
  });
}

async function updateConversationStatus(req, res) {
  const conversationId = Number(req.params.id);
  const userId = Number(req.user.sub);
  const role = String(req.user.role || "").trim().toUpperCase();
  const status = String(req.body.status || "").trim().toUpperCase();

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "invalid conversation id" });
  }

  if (!["OPEN", "PENDING", "CLOSED"].includes(status)) {
    return res.status(400).json({ ok: false, error: "invalid status" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      assignedToId: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ ok: false, error: "conversation not found" });
  }

  // AGENT: solo si la conversación está asignada a él
  // ADMIN / SUPERVISOR: cualquiera
  if (role === "AGENT" && conversation.assignedToId !== userId) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
    select: {
      id: true,
      externalId: true,
      customerPhone: true,
      status: true,
      assignedToId: true,
      lastMessageAt: true,
      lastMessageText: true,
      updatedAt: true,
    },
  });

  return res.json({
    ok: true,
    conversation: updatedConversation,
  });
}

module.exports = { 
  listConversations, 
  assignToMe, 
  assign, 
  unassign, 
  getConversationMessages,
  sendMessage,
  getConversationById,
  updateConversationStatus
                 };
