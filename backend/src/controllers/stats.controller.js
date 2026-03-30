const { prisma } = require("../prisma/client");

function parseDateParam(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

async function getStats(req, res) {
  try {
    // Build date range
    let from = parseDateParam(req.query.from, (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })());
    let to   = parseDateParam(req.query.to, new Date());

    if (!from || !to) {
      return res.status(400).json({ ok: false, error: 'Invalid date parameters' });
    }

    if (to - from > MAX_RANGE_MS) {
      return res.status(400).json({ ok: false, error: 'Date range too large (max 366 days)' });
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    // Run independent top-level queries in parallel
    const [
      currentlyOpen,
      currentlyUnassigned,
      currentlyAssigned,
      currentlyPending,
      resolvedInPeriod,
      byStatusRaw,
      conversationsPerDayRaw,
      messagesPerDayRaw,
      agents,
    ] = await Promise.all([
      // 1. Currently open (no date filter)
      prisma.conversation.count({ where: { status: "OPEN" } }),

      // 2. Currently unassigned and not closed (no date filter)
      prisma.conversation.count({
        where: { assignedToId: null, status: { not: "CLOSED" } },
      }),

      // 3. Currently assigned and not closed (no date filter)
      prisma.conversation.count({
        where: { assignedToId: { not: null }, status: { not: "CLOSED" } },
      }),

      // 4. Currently pending (no date filter)
      prisma.conversation.count({ where: { status: "PENDING" } }),

      // 4. Resolved in period
      prisma.conversation.count({
        where: { status: "CLOSED", updatedAt: { gte: from, lte: to } },
      }),

      // 5. By status grouped (conversations that changed state in the period)
      prisma.conversation.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { updatedAt: { gte: from, lte: to } },
      }),

      // 6. Conversations per day (raw)
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Conversation
        WHERE createdAt >= ${from} AND createdAt <= ${to}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,

      // 7. Messages per day by direction (raw)
      prisma.$queryRaw`
        SELECT DATE(occurredAt) as date, direction, COUNT(*) as count
        FROM Message
        WHERE occurredAt >= ${from} AND occurredAt <= ${to}
        GROUP BY DATE(occurredAt), direction
        ORDER BY date ASC
      `,

      // 8. Active users (stats computed below)
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
      }),
    ]);

    // Map byStatus
    const byStatus = byStatusRaw.map((row) => ({
      status: row.status,
      count: row._count.id,
    }));

    // Map conversationsPerDay — BigInt count, Date object
    const conversationsPerDay = conversationsPerDayRaw.map((row) => ({
      date: row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : String(row.date),
      count: Number(row.count),
    }));

    // Map messagesPerDay — group by date, pivot IN/OUT
    const msgByDate = {};
    for (const row of messagesPerDayRaw) {
      const dateStr = row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : String(row.date);

      if (!msgByDate[dateStr]) {
        msgByDate[dateStr] = { date: dateStr, IN: 0, OUT: 0 };
      }
      msgByDate[dateStr][row.direction] = Number(row.count);
    }
    const messagesPerDay = Object.values(msgByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Unassigned row stats
    const [unassignedOpen, unassignedPending, unassignedResolved] = await Promise.all([
      prisma.conversation.count({ where: { assignedToId: null, status: "OPEN" } }),
      prisma.conversation.count({ where: { assignedToId: null, status: "PENDING" } }),
      prisma.conversation.count({
        where: { assignedToId: null, status: "CLOSED", updatedAt: { gte: from, lte: to } },
      }),
    ]);

    const unassignedRow = {
      userId: null,
      firstName: "Sin asignar",
      lastName: "",
      avatarUrl: null,
      role: null,
      currentlyOpen: unassignedOpen,
      currentlyPending: unassignedPending,
      resolvedInPeriod: unassignedResolved,
      messagesSent: 0,
    };

    // Compute per-agent stats in parallel
    const byAgent = await Promise.all(
      agents.map(async (agent) => {
        const [currentlyOpen, currentlyPending, resolvedInPeriod, messagesSent] =
          await Promise.all([
            prisma.conversation.count({
              where: { assignedToId: agent.id, status: "OPEN" },
            }),
            prisma.conversation.count({
              where: { assignedToId: agent.id, status: "PENDING" },
            }),
            prisma.conversation.count({
              where: {
                assignedToId: agent.id,
                status: "CLOSED",
                updatedAt: { gte: from, lte: to },
              },
            }),
            prisma.message.count({
              where: {
                sentById: agent.id,
                direction: "OUT",
                occurredAt: { gte: from, lte: to },
              },
            }),
          ]);

        return {
          userId: agent.id,
          firstName: agent.firstName,
          lastName: agent.lastName,
          avatarUrl: agent.avatarUrl,
          role: agent.role,
          currentlyOpen,
          currentlyPending,
          resolvedInPeriod,
          messagesSent,
        };
      })
    );

    return res.json({
      ok: true,
      from: from.toISOString(),
      to: to.toISOString(),
      kpis: {
        currentlyOpen,
        currentlyUnassigned,
        currentlyAssigned,
        currentlyPending,
        resolvedInPeriod,
      },
      byStatus,
      conversationsPerDay,
      messagesPerDay,
      byUser: [unassignedRow, ...byAgent],
    });
  } catch (err) {
    console.error("[getStats]", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function getUserConversations(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10)
    if (isNaN(userId)) {
      return res.status(400).json({ ok: false, error: 'Invalid userId' })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!targetUser) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }

    let from = parseDateParam(req.query.from, (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })())
    let to   = parseDateParam(req.query.to, new Date())

    if (!from || !to) {
      return res.status(400).json({ ok: false, error: 'Invalid date parameters' })
    }

    if (to - from > MAX_RANGE_MS) {
      return res.status(400).json({ ok: false, error: 'Date range too large (max 366 days)' })
    }

    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)

    // Buscar conversationIds donde el usuario envió mensajes en el período
    const sentMessages = await prisma.message.findMany({
      where: {
        sentById: userId,
        direction: 'OUT',
        occurredAt: { gte: from, lte: to },
      },
      select: { conversationId: true },
      distinct: ['conversationId'],
    })

    const convIds = sentMessages.map(m => m.conversationId)

    if (convIds.length === 0) {
      return res.json({ ok: true, conversations: [] })
    }

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: convIds } },
      select: {
        id: true,
        status: true,
        contactName: true,
        lastMessageAt: true,
        lastMessageText: true,
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    return res.json({ ok: true, conversations })
  } catch (err) {
    console.error('[getUserConversations]', err)
    return res.status(500).json({ ok: false, error: 'Internal server error' })
  }
}

module.exports = { getStats, getUserConversations };
