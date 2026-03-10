const { prisma } = require("../prisma/client");
const { emitToConversationAudience } = require("../services/realtime.service");

// saca conversationId del payload (varía según evento)
function getExternalConversationId(body) {
  return (
    body?.conversation?.id ??
    body?.message?.conversation?.id ??
    null
  );
}

function getCustomerPhone(body, eventSlug) {
  if (eventSlug === "message.incomming") {
    return body?.message?.channel?.to ?? null;
  }

  if (eventSlug === "message.outgoing") {
    return body?.message?.channel?.to ?? null;
  }

  return null;
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

    // Respondemos YA al proveedor
    res.json({ ok: true });

    // Y procesamos después
    setImmediate(async () => {
      try {
        // upsert de Conversation
        const customerPhone = getCustomerPhone(body, eventSlug);

        const conversation = await prisma.conversation.upsert({
          where: { externalId: String(externalConversationId) },
          update: {
            ...(customerPhone && { customerPhone }),
          },
          create: {
            externalId: String(externalConversationId),
            customerPhone,
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

          const rawState = String(msg.stateSlug || "ERROR").toUpperCase();
          const allowed = ["PENDING", "SENT", "RECEIVED", "READ", "ERROR", "DELETED"];
          const state = allowed.includes(rawState) ? rawState : "ERROR";

          const message = await prisma.message.upsert({
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
              conversationId : conversation.id,
            },
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: occurredAt,
              lastMessageText: text,
            },
          });

          // marcar conversación como no leída para todos

          await prisma.conversationUserState.deleteMany({
            where: {
              conversationId: conversation.id,
            },
          });

        emitToConversationAudience("message:new",{
            conversation,
            message: {
              id: message.id,
              externalId: message.externalId,
              text: message.text,
              direction: message.direction,
              state: message.state,
              occurredAt: message.occurredAt,
              stateAt: message.stateAt,
              conversationId: message.conversationId,
              createdAt: message.createdAt,
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

          const message = await prisma.message.update({
            where: { externalId },
            data: { state, stateAt },
          });
      

          emitToConversationAudience("message:update",{conversation, message});
        }
      } catch (err) {
        console.error("async providerWebhook error:", err);
      }
    });
  } catch (err) {
    console.error("providerWebhook error:", err);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
}

module.exports = { providerWebhook };