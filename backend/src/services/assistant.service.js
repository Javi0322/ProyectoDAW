const { prisma } = require("../prisma/client");

const SQL_SYSTEM_PROMPT = `Eres un asistente de datos para PowerChat, una plataforma de soporte por WhatsApp.
Tu unica tarea es convertir preguntas en lenguaje natural a queries MySQL SELECT validas.
La respuesta debe ser UNICAMENTE el SQL, empezando con SELECT, sin markdown, sin comentarios, sin explicacion.

ESQUEMA DE TABLAS
=================

Conversation
  id            INT  PK
  externalId    VARCHAR  UNIQUE
  customerPhone VARCHAR              -- telefono del cliente (ej: "+34612345678")
  contactName   VARCHAR              -- nombre del contacto/cliente
  status        ENUM(OPEN, PENDING, CLOSED)
  assignedToId  INT  FK->User NULL   -- NULL = sin asignar
  lastMessageAt DATETIME             -- fecha del ultimo mensaje (usa esto, evita JOIN a Message)
  lastMessageText TEXT               -- texto del ultimo mensaje (usa esto, evita JOIN a Message)
  createdAt     DATETIME

Message
  id             INT  PK
  conversationId INT  FK->Conversation
  direction      ENUM(IN, OUT)       -- IN=mensaje del cliente, OUT=mensaje del agente
  state          ENUM(PENDING, SENT, RECEIVED, READ, ERROR, DELETED)
  text           TEXT NULL           -- NULL en mensajes multimedia (imagenes, audio, etc.)
  sentiment      ENUM(positive, neutral, negative, angry) NULL  -- solo en mensajes IN
  occurredAt     DATETIME            -- fecha real del mensaje
  sentById       INT FK->User NULL   -- solo en mensajes OUT
  createdAt      DATETIME

User
  id        INT  PK
  email     VARCHAR
  firstName VARCHAR
  lastName  VARCHAR
  role      ENUM(ADMIN, SUPERVISOR, AGENT)
  active    BOOLEAN
  createdAt DATETIME

Label
  id        INT  PK
  name      VARCHAR
  color     VARCHAR
  active    BOOLEAN
  createdAt DATETIME

ConversationLabel  (tabla puente N:M entre Conversation y Label)
  id             INT  PK
  conversationId INT  FK->Conversation
  labelId        INT  FK->Label
  createdAt      DATETIME

GLOSARIO
========

"cliente" / "contacto"          -> Conversation.contactName, Conversation.customerPhone
"agente"                        -> User WHERE role='AGENT'
"conversacion abierta/activa"   -> Conversation WHERE status='OPEN'
"conversacion pendiente"        -> Conversation WHERE status='PENDING'
"conversacion cerrada/resuelta" -> Conversation WHERE status='CLOSED'
"sin asignar"                   -> Conversation WHERE assignedToId IS NULL
"asignada a [nombre]"           -> JOIN User u ON c.assignedToId=u.id WHERE u.firstName LIKE '%nombre%'
"etiqueta"                      -> Label; relacion N:M via ConversationLabel
"mensaje entrante"              -> Message WHERE direction='IN'
"mensaje saliente"              -> Message WHERE direction='OUT'
"sentimiento negativo"          -> Message WHERE sentiment IN ('negative','angry')
"hoy"                           -> DATE(campo) = CURDATE()
"esta semana"                   -> YEARWEEK(campo, 1) = YEARWEEK(CURDATE(), 1)
"este mes"                      -> MONTH(campo)=MONTH(CURDATE()) AND YEAR(campo)=YEAR(CURDATE())
"este anyo"                     -> YEAR(campo) = YEAR(CURDATE())
"ultimos N dias"                -> campo >= DATE_SUB(CURDATE(), INTERVAL N DAY)
"entre fecha1 y fecha2"         -> campo BETWEEN 'fecha1' AND 'fecha2'

IMPORTANTE: si la pregunta NO menciona estado, NO filtres por status (incluye OPEN, PENDING y CLOSED).
IMPORTANTE: "activo" referido a conversacion = status='OPEN'. La columna 'active' NO existe en Conversation.
IMPORTANTE: la columna 'active' solo existe en User y Label.

REGLAS
======

R1.  Respuesta = SOLO SQL empezando con SELECT, o CLARIFY:<pregunta> si necesitas aclaracion. Sin markdown, sin comentarios, sin punto y coma al final.
R1b. CLARIFY solo como ultimo recurso. Antes de usar CLARIFY DEBES intentar:
     1. Buscar el contexto en el historial de la conversacion
     2. Reutilizar el WHERE de la query anterior si la pregunta es un seguimiento
     3. Usar LIKE '%termino%' si el valor es aproximado
     4. Si el usuario responde "si", "vale", "exacto", "eso", "si eso" a una pregunta de aclaracion anterior, ejecuta la query que correspondia a esa aclaracion
     Solo usa CLARIFY si despues de todo lo anterior sigue siendo imposible generar una query minimamente util. Ejemplos validos de CLARIFY:
     - La pregunta no tiene ningun antecedente en el historial y podria referirse a cosas completamente distintas
     - El usuario pide algo contradictorio o imposible de mapear a SQL
R2.  NUNCA uses placeholders ('tu_etiqueta', 'nombre_aqui', etc.). Si el valor es ambiguo usa LIKE '%' o elimina ese filtro.
R3.  Solo SELECT. Prohibido: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, EXEC, CALL.
R4.  Notacion de columnas: SIEMPRE alias.columna (c.status, m.text, u.firstName). NUNCA guion bajo (m_occurredAt es incorrecto).
R5.  GROUP BY solo con funciones de agregacion (COUNT, SUM, AVG, MIN, MAX). Incluir en GROUP BY todas las columnas no agregadas del SELECT.
R6.  COUNT en joins N:M (ConversationLabel): usa COUNT(DISTINCT c.id) para evitar duplicados.
R6b. Etiquetas: para filtrar o mostrar el nombre de una etiqueta SIEMPRE necesitas DOS JOINs: JOIN ConversationLabel cl ON c.id=cl.conversationId JOIN Label l ON cl.labelId=l.id. Nunca referencees l.name o l.id sin haber hecho el JOIN a Label. Si solo necesitas contar etiquetas por conversacion sin filtrar por nombre, basta con JOIN ConversationLabel cl y usar COUNT(cl.labelId).
R6c. Cuando la pregunta pide cuantas conversaciones tiene CADA etiqueta (todas, no solo las que tienen alguna), usa LEFT JOIN desde Label: SELECT l.name, COUNT(DISTINCT cl.conversationId) AS total FROM Label l LEFT JOIN ConversationLabel cl ON l.id=cl.labelId GROUP BY l.id, l.name. Esto incluye etiquetas con 0 conversaciones. Usa JOIN (no LEFT) solo cuando el usuario pida explicitamente etiquetas que SI tengan conversaciones.
R7.  JOIN a User: usa siempre LEFT JOIN (assignedToId puede ser NULL). No hagas JOIN a User si no necesitas columnas de User.
R8.  JOIN a Message: solo si la pregunta es sobre mensajes (texto, sentimiento, cantidad de mensajes). Para el ultimo mensaje usa c.lastMessageText y c.lastMessageAt que ya estan en Conversation, sin JOIN.
R9.  Subqueries correlacionadas: alias de tabla interna diferente al de tabla externa (exterior 'c', interior 'c2').
R10. Para preguntas de seguimiento, reutiliza el WHERE de la query anterior del historial. Patrones comunes:
     - "tiene mas X?" / "cuantos X tiene?" -> la entidad es la del resultado anterior, aplica su id o filtro
     - "y ese?" / "y el/la de X?" -> mismo WHERE, diferente SELECT
     - "cuando se creo?" / "quien la tiene asignada?" -> SELECT del campo pedido WHERE id = <id del resultado anterior>
     - "si" / "si eso" / "vale" / "exacto" -> ejecuta la query que correspondia a la aclaracion anterior
R11. Para buscar por nombre parcial usa LIKE '%termino%'.
R12. Fechas sobre mensajes: usar occurredAt. Fechas sobre conversaciones: usar createdAt o lastMessageAt segun contexto.
R13. Limite de filas: si la pregunta pide "el que mas", "el primero", "el ultimo" -> ORDER BY ... LIMIT 1. Si pide un listado sin limite explicito, no pongas LIMIT.

EJEMPLOS
========

P: cuantas conversaciones hay abiertas
SELECT COUNT(*) AS total FROM Conversation c WHERE c.status = 'OPEN'

P: cuantas conversaciones hay por estado
SELECT c.status, COUNT(*) AS total FROM Conversation c GROUP BY c.status ORDER BY total DESC

P: cuantas conversaciones se crearon este mes
SELECT COUNT(*) AS total FROM Conversation c WHERE MONTH(c.createdAt)=MONTH(CURDATE()) AND YEAR(c.createdAt)=YEAR(CURDATE())

P: cuantas conversaciones nuevas por dia hubo este mes
SELECT DATE(c.createdAt) AS dia, COUNT(*) AS total FROM Conversation c WHERE MONTH(c.createdAt)=MONTH(CURDATE()) AND YEAR(c.createdAt)=YEAR(CURDATE()) GROUP BY DATE(c.createdAt) ORDER BY dia ASC

P: cuantas conversaciones sin asignar hay abiertas
SELECT COUNT(*) AS total FROM Conversation c WHERE c.status='OPEN' AND c.assignedToId IS NULL

P: cuales son las conversaciones abiertas sin asignar
SELECT c.id, c.contactName, c.customerPhone, c.lastMessageText, c.lastMessageAt FROM Conversation c WHERE c.status='OPEN' AND c.assignedToId IS NULL ORDER BY c.lastMessageAt DESC

P: que agente tiene mas conversaciones abiertas
SELECT u.firstName, u.lastName, COUNT(c.id) AS total FROM Conversation c LEFT JOIN User u ON c.assignedToId=u.id WHERE c.status='OPEN' AND u.id IS NOT NULL GROUP BY u.id, u.firstName, u.lastName ORDER BY total DESC LIMIT 1

P: cuantas conversaciones tiene asignadas cada agente
SELECT u.firstName, u.lastName, COUNT(c.id) AS total FROM Conversation c LEFT JOIN User u ON c.assignedToId=u.id WHERE u.role='AGENT' GROUP BY u.id, u.firstName, u.lastName ORDER BY total DESC

P: cuantas conversaciones cerro cada agente esta semana
SELECT u.firstName, u.lastName, COUNT(c.id) AS total FROM Conversation c LEFT JOIN User u ON c.assignedToId=u.id WHERE c.status='CLOSED' AND YEARWEEK(c.lastMessageAt,1)=YEARWEEK(CURDATE(),1) AND u.id IS NOT NULL GROUP BY u.id, u.firstName, u.lastName ORDER BY total DESC

P: busca conversaciones del cliente Garcia
SELECT c.id, c.contactName, c.customerPhone, c.status, c.lastMessageAt FROM Conversation c WHERE c.contactName LIKE '%Garcia%' ORDER BY c.lastMessageAt DESC

P: cuantas conversaciones tienen etiqueta
SELECT COUNT(DISTINCT c.id) AS total FROM Conversation c JOIN ConversationLabel cl ON c.id=cl.conversationId

P: cuantas conversaciones no tienen ninguna etiqueta
SELECT COUNT(*) AS total FROM Conversation c LEFT JOIN ConversationLabel cl ON c.id=cl.conversationId WHERE cl.id IS NULL

P: cuantas conversaciones tiene cada etiqueta
SELECT l.name, COUNT(DISTINCT cl.conversationId) AS total FROM Label l LEFT JOIN ConversationLabel cl ON l.id=cl.labelId GROUP BY l.id, l.name ORDER BY total DESC

P: que conversaciones tienen la etiqueta Test1
SELECT c.id, c.contactName, c.customerPhone, c.status, c.lastMessageAt FROM Conversation c JOIN ConversationLabel cl ON c.id=cl.conversationId JOIN Label l ON cl.labelId=l.id WHERE l.name='Test1' ORDER BY c.lastMessageAt DESC

P: que etiquetas tiene la conversacion 1
SELECT l.name, l.color FROM ConversationLabel cl JOIN Label l ON cl.labelId=l.id WHERE cl.conversationId=1

-- Ejemplo de seguimiento: query anterior encontro la conversacion id=1, ahora preguntan por sus etiquetas
P (historial: SELECT ... WHERE l.name='Test1' -> resultado id=1): tiene mas etiquetas?
SELECT l.name, l.color FROM ConversationLabel cl JOIN Label l ON cl.labelId=l.id WHERE cl.conversationId=1

-- Ejemplo de seguimiento: query anterior encontro conversacion id=1, preguntan por el agente asignado
P (historial: resultado id=1 con assignedToId): quien la tiene asignada?
SELECT u.firstName, u.lastName, u.email FROM Conversation c LEFT JOIN User u ON c.assignedToId=u.id WHERE c.id=1

-- Ejemplo de seguimiento: preguntan cuantas etiquetas tiene la conversacion encontrada antes
P (historial: resultado id=1): cuantas etiquetas tiene?
SELECT COUNT(cl.labelId) AS total_etiquetas FROM ConversationLabel cl WHERE cl.conversationId=1

P: que conversaciones tienen mas de una etiqueta
SELECT c.id, c.contactName, c.customerPhone, c.status, COUNT(cl.labelId) AS total_etiquetas FROM Conversation c JOIN ConversationLabel cl ON c.id=cl.conversationId GROUP BY c.id, c.contactName, c.customerPhone, c.status HAVING total_etiquetas > 1 ORDER BY total_etiquetas DESC

P: que conversaciones tienen la etiqueta Test1 y mas de una etiqueta en total
SELECT c.id, c.contactName, c.customerPhone, c.status, COUNT(cl.labelId) AS total_etiquetas FROM Conversation c JOIN ConversationLabel cl ON c.id=cl.conversationId WHERE c.id IN (SELECT cl2.conversationId FROM ConversationLabel cl2 JOIN Label l ON cl2.labelId=l.id WHERE l.name='Test1') GROUP BY c.id, c.contactName, c.customerPhone, c.status HAVING total_etiquetas > 1

P: cuantas conversaciones abiertas hay por etiqueta
SELECT l.name, COUNT(DISTINCT c.id) AS total FROM Conversation c JOIN ConversationLabel cl ON c.id=cl.conversationId JOIN Label l ON cl.labelId=l.id WHERE c.status='OPEN' GROUP BY l.id, l.name ORDER BY total DESC

P: cuantos mensajes entrantes hubo hoy
SELECT COUNT(*) AS total FROM Message m WHERE m.direction='IN' AND DATE(m.occurredAt)=CURDATE()

P: cuantos mensajes con sentimiento negativo o angry hubo esta semana
SELECT COUNT(*) AS total FROM Message m WHERE m.sentiment IN ('negative','angry') AND YEARWEEK(m.occurredAt,1)=YEARWEEK(CURDATE(),1)

P: cuantos mensajes por sentimiento hubo este mes
SELECT m.sentiment, COUNT(*) AS total FROM Message m WHERE m.direction='IN' AND MONTH(m.occurredAt)=MONTH(CURDATE()) AND YEAR(m.occurredAt)=YEAR(CURDATE()) GROUP BY m.sentiment ORDER BY total DESC

P: que conversaciones tienen mensajes con sentimiento angry hoy
SELECT DISTINCT c.id, c.contactName, c.customerPhone FROM Conversation c JOIN Message m ON m.conversationId=c.id WHERE m.sentiment='angry' AND DATE(m.occurredAt)=CURDATE()

P: cuantas conversaciones se cerraron en los ultimos 7 dias
SELECT COUNT(*) AS total FROM Conversation c WHERE c.status='CLOSED' AND c.lastMessageAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)

P: cuantas conversaciones nuevas hubo la semana pasada
SELECT COUNT(*) AS total FROM Conversation c WHERE YEARWEEK(c.createdAt,1)=YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK),1)`;

const SUMMARY_SYSTEM_PROMPT = `Eres un analista de datos para PowerChat.
Recibes una pregunta y los resultados de una query en formato: "Resultados (N filas): [...]".
REGLAS ESTRICTAS:
- Si N > 0 hay datos. NUNCA digas que no hay resultados cuando N > 0.
- Si N = 0 indica que no se encontraron datos.
- Responde en el mismo idioma de la pregunta, maximo 3 frases, directo al punto.
- No menciones SQL, bases de datos, filas ni JSON.
- No inventes datos que no esten en los resultados.
- Si hay una sola fila, habla en singular. Si hay varias, menciona cuantas.`;


function validateSql(raw) {
  // Eliminar bloques de codigo markdown
  let s = raw.trim().replace(/```(?:sql)?\s*/gi, "").replace(/```/g, "").trim();

  // Si el modelo devolvio texto libre antes del SELECT, extraer desde el primer SELECT
  const selectMatch = s.match(/\bSELECT\b[\s\S]*/i);
  if (selectMatch) s = selectMatch[0].trim();

  // Cortar en el primer punto y coma
  const semiIdx = s.indexOf(";");
  if (semiIdx !== -1) s = s.slice(0, semiIdx).trim();

  // Eliminar comentarios SQL inline (-- texto hasta fin de linea)
  s = s.replace(/--[^\n]*/g, "").trim();

  if (!/^SELECT\b/i.test(s)) throw new Error("Only SELECT queries are allowed");
  if (/\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|CALL|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i.test(s))
    throw new Error("Query contains forbidden keywords");

  // Corrige alias_columna -> alias.columna generado por el modelo
  s = s.replace(/\b([a-z]{1,3})_([a-zA-Z][a-zA-Z0-9_]*)\b/g, (match, alias, col) => {
    const knownAliases = ["m", "c", "u", "msg", "conv", "cl", "lb"];
    return knownAliases.includes(alias) ? `${alias}.${col}` : match;
  });

  return s;
}

function messagesToPrompt(messages) {
  let prompt = "";
  for (const m of messages) {
    if (m.role === "system") {
      prompt += `<|im_start|>system\n${m.content}<|im_end|>\n`;
    } else if (m.role === "user") {
      prompt += `<|im_start|>user\n${m.content}<|im_end|>\n`;
    } else if (m.role === "assistant") {
      prompt += `<|im_start|>assistant\n${m.content}<|im_end|>\n`;
    }
  }
  prompt += "<|im_start|>assistant\n";
  return prompt;
}

function extractContent(data) {
  const out = data?.output;
  if (Array.isArray(out)) {
    const text = out[0]?.choices?.[0]?.text;
    if (typeof text === "string") return text;
    const msgContent = out[0]?.choices?.[0]?.message?.content;
    if (typeof msgContent === "string") return msgContent;
    if (typeof out[0]?.generated_text === "string") return out[0].generated_text;
    if (typeof out[0] === "string") return out[0];
  }
  if (typeof out === "string") return out;
  if (typeof out?.text === "string") return out.text;
  if (typeof out?.response === "string") return out.response;
  const choice = out?.choices?.[0]?.text ?? out?.choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  return null;
}

async function callOllama(messages, label = "runpod") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  const t0 = Date.now();
  try {
    const res = await fetch(`https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/runsync`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify({ input: { prompt: messagesToPrompt(messages) } }),
    });
    if (!res.ok) throw new Error(`RunPod ${res.status}`);
    const data = await res.json();
    const content = extractContent(data);
    if (!content) {
      console.error("RunPod unexpected response:", JSON.stringify(data));
      throw new Error("RunPod response shape unexpected");
    }
    console.log(`[assistant:${label}] ${Date.now() - t0}ms`, label === "sql" ? `\n-> ${content.trim()}` : "");
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

async function buildDynamicContext() {
  const [labels, users] = await Promise.all([
    prisma.label.findMany({ where: { active: true }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, email: true, firstName: true, lastName: true, role: true }, orderBy: { firstName: "asc" } }),
  ]);

  const labelsText = labels.length
    ? labels.map(l => `  - id=${l.id}, name="${l.name}", color="${l.color}"`).join("\n")
    : "  (sin etiquetas activas)";

  const usersText = users.length
    ? users.map(u => `  - id=${u.id}, email="${u.email}", nombre="${u.firstName} ${u.lastName}", role=${u.role}`).join("\n")
    : "  (sin usuarios activos)";

  return `\nDATOS REALES DE LA BD (usa estos valores exactos para filtrar, no inventes nombres ni IDs):\n\nEtiquetas activas:\n${labelsText}\n\nUsuarios activos:\n${usersText}`;
}

async function askAssistant(message, history = []) {
  const [sqlHistory, dynamicContext] = await Promise.all([
    Promise.resolve(history.map(m =>
      m.role === "assistant" && m.sql
        ? { role: "assistant", content: `SQL ejecutado:\n${m.sql}\nRespuesta al usuario:\n${m.content}` }
        : { role: m.role, content: m.content }
    )),
    buildDynamicContext(),
  ]);

  const sqlMessages = [
    { role: "system", content: SQL_SYSTEM_PROMPT + dynamicContext },
    ...sqlHistory,
    { role: "user", content: message },
  ];

  let rawSql;
  try {
    rawSql = await callOllama(sqlMessages, "sql");
  } catch (err) {
    const e = new Error("RunPod no disponible");
    e.code = "RUNPOD_UNAVAILABLE";
    throw e;
  }

  // El modelo puede pedir aclaracion en vez de generar SQL
  const clarifyMatch = rawSql.match(/^CLARIFY:\s*(.+)/is);
  if (clarifyMatch) {
    const question = clarifyMatch[1].trim();
    console.log("[assistant] pidiendo aclaracion:", question);
    return { answer: question, sql: null, clarify: true };
  }

  let sql;
  try {
    sql = validateSql(rawSql);
  } catch (err) {
    console.error("[assistant:sql] raw output que fallo la validacion:\n", rawSql);
    const e = new Error(err.message);
    e.code = "INVALID_SQL";
    throw e;
  }
  console.log("[assistant:sql] SQL validado ->\n", sql);

  let rows;
  try {
    rows = await prisma.$queryRawUnsafe(sql);
  } catch (err) {
    // Reintento automatico para ONLY_FULL_GROUP_BY (MySQL strict mode, codigo 1055)
    if (err.message?.includes("1055") && /GROUP BY/i.test(sql)) {
      try {
        const safeSql = sql.replace(
          /^(SELECT\s+)([\s\S]+?)(\s+FROM\b)/i,
          (_, select, cols, from) => {
            const fixed = cols.split(",").map(col => {
              const c = col.trim();
              // Dejar intactas las funciones de agregacion ya existentes
              if (/^(COUNT|SUM|AVG|MIN|MAX|ANY_VALUE)\s*\(/i.test(c)) return col;
              // Envolver el resto en ANY_VALUE(), preservando el alias AS si lo tiene
              const aliasMatch = c.match(/\s+AS\s+\S+$/i);
              const colExpr = aliasMatch ? c.slice(0, aliasMatch.index).trim() : c;
              const alias = aliasMatch ? aliasMatch[0] : "";
              return `ANY_VALUE(${colExpr})${alias}`;
            }).join(", ");
            return `${select}${fixed}${from}`;
          }
        );
        console.log("[assistant:sql] reintento ANY_VALUE ->\n", safeSql);
        rows = await prisma.$queryRawUnsafe(safeSql);
      } catch {
        const e = new Error("La query generada no es valida: " + err.message);
        e.code = "SQL_EXEC_ERROR";
        throw e;
      }
    } else {
      const e = new Error("La query generada no es valida: " + err.message);
      e.code = "SQL_EXEC_ERROR";
      throw e;
    }
  }

  const rowsJson = JSON.stringify(rows, (_, v) => typeof v === "bigint" ? Number(v) : v);
  console.log(`[assistant:sql] filas devueltas: ${rows.length}`, rows.length <= 3 ? rowsJson : "(truncado)");

  if (rows.length === 0) {
    return { answer: "No se encontraron datos para esa consulta.", sql };
  }

  const summaryMessages = [
    { role: "system", content: SUMMARY_SYSTEM_PROMPT },
    { role: "user", content: `Pregunta: ${message}\n\nResultados (${rows.length} filas):\n${rowsJson}` },
  ];

  let answer;
  try {
    answer = await callOllama(summaryMessages, "summary");
  } catch (err) {
    const e = new Error("RunPod no disponible");
    e.code = "RUNPOD_UNAVAILABLE";
    throw e;
  }

  return { answer, sql };
}

module.exports = { askAssistant };
