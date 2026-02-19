const { prisma } = require("../prisma/client");

// saca conversationId del payload (varía según evento)
function getExternalConversationId(body) {
  return (
    body?.conversation?.id ??
    body?.message?.conversation?.id ??
    null
  );
}

async function providerWebhook(req, res) {
  try {
    const body = req.body;
    const eventSlug = body?.event?.eventSlug;

    if (!eventSlug) {
      return res.status(400).json({ ok: false, error: "missing eventSlug" });
    }

    // Solo soportamos estos 3
    if (!["message.incomming", "message.outgoing", "message.state_updated"].includes(eventSlug)) {
      return res.json({ ok: true, ignored: true, eventSlug });
    }

    const externalConversationId = getExternalConversationId(body);
    if (!externalConversationId) {
      return res.status(400).json({ ok: false, error: "missing conversation id" });
    }

    // upsert de Conversation
    const conversation = await prisma.conversation.upsert({
      where: { externalId: String(externalConversationId) },
      update: {},
      create: {
        externalId: String(externalConversationId),
      },
    });

    // 1) INCOMING / OUTGOING → creamos mensaje
    if (eventSlug === "message.incomming" || eventSlug === "message.outgoing") {
      const msg = body.message;

      const externalId = String(msg.id);
      const text = msg.text ?? null;
      const occurredAt = new Date(msg.date);
      const stateAt = msg.stateDate ? new Date(msg.stateDate) : null;

      const direction = eventSlug === "message.incomming" ? "IN" : "OUT";

      // stateSlug viene como texto: PENDING/SENT/RECEIVED/READ/ERROR/DELETED
      // lo guardamos tal cual (si viene algo raro, lo convertimos a ERROR)
      const rawState = String(msg.stateSlug || "ERROR").toUpperCase();
      const allowed = ["PENDING", "SENT", "RECEIVED", "READ", "ERROR", "DELETED"];
      const state = allowed.includes(rawState) ? rawState : "ERROR";

      // upsert mensaje por externalId para evitar duplicados
      await prisma.message.upsert({
        where: { externalId },
        update: {
          state,
          stateAt,
          text,
        },
        create: {
          externalId,
          direction,
          state,
          text,
          occurredAt,
          stateAt,
          conversationId: conversation.id,
        },
      });

      // actualizar resumen de conversación
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: occurredAt,
          lastMessageText: text,
        },
      });
    }

    // 2) STATE_UPDATED → actualizamos estado del mensaje ya existente
    if (eventSlug === "message.state_updated") {
      const msg = body.message;

      const externalId = String(msg.id);
      const rawState = String(msg.stateSlug || "ERROR").toUpperCase();
      const allowed = ["PENDING", "SENT", "RECEIVED", "READ", "ERROR", "DELETED"];
      const state = allowed.includes(rawState) ? rawState : "ERROR";

      const stateAt = msg.stateDate ? new Date(msg.stateDate) : new Date();

      await prisma.message.updateMany({
        where: { externalId },
        data: { state, stateAt },
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("providerWebhook error:", err);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
}

module.exports = { providerWebhook };
