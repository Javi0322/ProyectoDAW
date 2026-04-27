# PowerChat — Inbox WhatsApp Multiagente

Aplicación web completa tipo **bandeja de entrada multiagente para WhatsApp**. Permite que varios agentes reciban, gestionen y respondan conversaciones de WhatsApp desde un único panel, con actualización en tiempo real.

El sistema se conecta a un proveedor externo de mensajería que:

- Permite enviar mensajes por API
- Envía eventos por **webhook**
- Notifica mensajes entrantes, salientes y actualizaciones de estado

------------------------------------------------------------------------

## Stack tecnológico

### Backend

- Node.js + Express v5
- Prisma ORM + MySQL
- Socket.IO v4 (tiempo real)
- JWT (autenticación, 24 h)
- `crypto.scrypt` (hash de contraseñas)
- Multer (subida de avatares)
- Express Rate Limit
- Analizador de sentimiento propio en español (`sentiment.service.js`)
- RunPod + Ollama (`qwen2.5-coder:14b` / `32b`) — inferencia del asistente IA

### Frontend

- Vite + Vue 3 (Composition API + `<script setup>`)
- Pinia (estado global)
- Tailwind CSS (diseño responsive: móvil, tablet y desktop)
- Socket.IO client
- Vue Router (guards por rol)

------------------------------------------------------------------------

## Funcionalidades del frontend

### Autenticación

- Login con email y contraseña
- Token JWT almacenado en `localStorage`
- Guards de ruta por autenticación y rol (`ADMIN`, `SUPERVISOR`, `AGENT`)
- Logout con limpieza completa de estado y redirección

### Bandeja de conversaciones

- Lista de conversaciones con último mensaje, hora y estado de lectura
- Filtros por **alcance** (todas / mías / sin asignar) y **estado** (abierta / pendiente / cerrada)
- Paginación con "cargar más"
- Indicador de no leído
- Búsqueda en tiempo real vía Socket.IO
- Puntos de colores en cada elemento de la lista para mostrar las etiquetas asignadas a la conversación

### Vista de chat

- Hilo de mensajes con separadores de fecha
- Burbujas de mensaje diferenciadas por dirección (entrante / saliente)
- Iconos de estado de mensaje estilo WhatsApp: reloj (PENDING), ✓ gris (SENT), ✓✓ gris (RECEIVED), ✓✓ azul (READ), ✗ rojo (ERROR)
- Carga de mensajes anteriores (paginación por cursor)
- Scroll automático al recibir mensajes nuevos
- Input de texto con autoexpansión y envío por Enter

### Cabecera de conversación

- Nombre del contacto editable en línea
- Asignación de agente con dropdown (carga usuarios desde API)
- Cambio de estado de conversación (Abierta / Pendiente / Cerrada)
- Badge de estado del contacto
- Gestión de etiquetas: dropdown con listado de etiquetas disponibles, checkbox para añadir/quitar, contador de etiquetas asignadas (máx. 5)

### Dashboard de métricas *(SUPERVISOR y ADMIN)*

- KPIs en tiempo real agrupados en cuatro secciones: **Por asignación**, **Por estado**, **Por día** y **Por usuario**
- Filtro de rango de fechas con presets rápidos (hoy, 7 d, 30 d) y selector personalizado
- Polling automático cada 60 segundos (sin WebSocket)
- Gráfico donut de conversaciones por estado (OPEN / PENDING / CLOSED)
- Gráficos de líneas: conversaciones nuevas por día y mensajes por día (IN/OUT)
- Tabla de rendimiento por usuario: conversaciones abiertas, pendientes, resueltas y mensajes enviados en el período
- Fila virtual "Sin asignar" para conversaciones sin agente
- Panel lateral de drill-down: al clicar en un usuario se listan las conversaciones en las que ha interactuado; botón "Abrir →" navega al chat con scroll automático al mensaje más reciente
- **Asistente IA** (botón "Asistente IA" en el header): chat en lenguaje natural para consultar datos del sistema

### Asistente IA *(SUPERVISOR y ADMIN)*

Panel de chat lateral que permite hacer preguntas en lenguaje natural sobre los datos del sistema. Ejemplos de lo que puede responder:

- *¿Cuántas conversaciones hay abiertas ahora mismo?*
- *¿Qué agente tiene más conversaciones esta semana?*
- *¿Cuántos mensajes con sentimiento negativo hubo hoy?*
- *¿Qué conversaciones tienen la etiqueta "Urgente"?*
- *¿Cuántas conversaciones se cerraron el mes pasado?*

El asistente mantiene contexto conversacional completo: las preguntas de seguimiento ("¿y cuántas tiene ese cliente?", "¿tiene más etiquetas?") reutilizan el contexto de la respuesta anterior.

### Gestión de etiquetas *(solo ADMIN)*

- Tabla de etiquetas con muestra de color, nombre y acciones de editar/eliminar
- Crear y editar etiquetas con modal de formulario: nombre (máx. 40 caracteres) y paleta de 12 colores predefinidos con vista previa en tiempo real
- Baja lógica: al eliminar una etiqueta se desvincula de todas las conversaciones automáticamente

### Gestión de usuarios *(solo ADMIN)*

- Tabla de usuarios con avatar, nombre, email, rol y estado
- Crear y editar usuarios con modal de formulario
- Desactivación lógica (los usuarios no se eliminan físicamente)

### Perfil de usuario

- Vista con datos del usuario autenticado
- Subida de avatar (JPG, PNG o WebP, máx. 2 MB) con previsualización inmediata
- Toggle de modo oscuro / claro persistente
- Botón de cerrar sesión

### Tiempo real (Socket.IO)

- Conexión autenticada con JWT
- Rooms automáticas: `user:{id}`, `role:{ROLE}`
- Room manual de conversación (`conversation:join` / `conversation:leave`)
- Eventos recibidos: `message:new`, `message:update`, `conversation:assign`, `conversation:statusUpdate`
- La lista de conversaciones se actualiza automáticamente según filtros activos

------------------------------------------------------------------------

## Diseño responsive

La interfaz se adapta a tres tamaños de pantalla:

### Desktop (≥ 1024 px)

- Sidebar de navegación fijo a la izquierda (56 px)
- Panel de conversaciones (340 px) + panel de chat ocupando el resto
- Cabecera del chat con botones de asignar y cambiar estado visibles directamente

### Tablet (768 px – 1023 px)

- Mismo layout de dos columnas que desktop
- Cabecera del chat con menú hamburguesa (☰) que agrupa asignar y estado en un panel desplegable combinado

### Móvil (< 768 px)

- Barra de navegación fija en la parte inferior con columnas iguales (2 para agente/supervisor, 3 para admin)
- Vista de un panel a la vez: lista de conversaciones **o** chat (al seleccionar una conversación)
- Botón ← en la cabecera del chat para volver a la lista
- Menú hamburguesa (☰) en la cabecera del chat para asignar y cambiar estado
- El área de mensajes queda siempre encuadrada entre la cabecera del contacto y el input, sin scroll de página
- El cierre de sesión está disponible en la vista de perfil (/me)

------------------------------------------------------------------------

## Colección Postman

En `postman/` encontrarás el archivo `PowerChat.postman_collection.json` con todas las peticiones listas para importar.

Incluye:

- Auth (login con guardado automático del token)
- Me (perfil propio, subida de avatar)
- Conversaciones (listar, ver, asignar, mensajes, estado, leer, contacto)
- Usuarios (CRUD completo, requiere rol ADMIN)
- Webhooks (simulación de eventos del proveedor)

Para importarla: abre Postman → **Import** → selecciona el archivo.

------------------------------------------------------------------------

# 1. Requisitos previos

- Node.js
- npm
- MySQL
- Git
- Cloudflared (para exponer el webhook localmente)
- Postman (opcional, para probar la API)

------------------------------------------------------------------------

# 2. Instalación

## Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd ProyectoDAW
```

## Backend

```bash
cd backend
npm install
```

## Frontend

```bash
cd frontend
npm install
```

------------------------------------------------------------------------

# 3. Variables de entorno

## Backend — `backend/.env`

```
PORT=3000
DATABASE_URL="mysql://root:root@localhost:3306/proyectodaw"
JWT_ACCESS_SECRET=pon_aqui_un_secreto_largo
WEBHOOK_SECRET=pon_aqui_un_secreto_fijo_para_el_webhook
MESSAGE_API_BASE_URL=https://tu.proveedor.com
MESSAGE_API_USERNAME=usuario_del_proveedor
MESSAGE_API_PASSWORD=password_del_proveedor
MESSAGE_API_FROM=+34600000000
CORS_ORIGIN=http://localhost:5173

# Asistente IA (RunPod)
RUNPOD_API_KEY=tu_api_key_de_runpod
RUNPOD_ENDPOINT_ID=id_del_endpoint
```

> **Nota RunPod:** configura **Min Workers = 1** en el panel del endpoint para evitar cold starts de 30-40 segundos. Se recomienda el modelo `qwen2.5-coder:14b` (cabe en una RTX A4500 con VRAM suficiente) o `qwen2.5-coder:32b` si dispones de más VRAM.

## Frontend — `frontend/.env`

```
VITE_API_URL=http://localhost:3000
```

------------------------------------------------------------------------

# 4. Base de datos

Crear la base de datos en MySQL:

```sql
CREATE DATABASE proyectodaw
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

------------------------------------------------------------------------

# 5. Prisma

## Generar Prisma Client

```bash
cd backend
npx prisma generate --schema=prisma/schema.prisma
```

## Ejecutar migraciones

```bash
npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

## Seed — usuario por defecto

El seed crea el usuario inicial necesario para hacer login:

```
Email:    user@gmail.com
Password: user1234
Rol:      ADMIN
```

**En desarrollo** (`migrate dev`): el seed se ejecuta automáticamente al final de las migraciones.

**En producción** (`migrate deploy`): lanzarlo una vez de forma manual:

```bash
npx prisma db seed
```

El seed es idempotente: si el usuario ya existe no se duplica.

## Prisma Studio

```bash
npx prisma studio --schema=prisma/schema.prisma
```

------------------------------------------------------------------------

# 6. Arrancar el proyecto

## Backend

```bash
cd backend
npm run dev
```

Disponible en `http://localhost:3000`
Ruta de prueba: `http://localhost:3000/health`

## Frontend

```bash
cd frontend
npm run dev
```

Disponible en `http://localhost:5173`

------------------------------------------------------------------------

# 7. Estructura del proyecto

```
ProyectoDAW/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── assistant.controller.js
│   │   │   ├── conversations.controller.js
│   │   │   ├── labels.controller.js
│   │   │   ├── stats.controller.js
│   │   │   └── webhooks.controller.js
│   │   ├── routes/
│   │   │   ├── assistant.routes.js
│   │   │   ├── conversations.routes.js
│   │   │   ├── labels.routes.js
│   │   │   └── stats.routes.js
│   │   ├── middleware/
│   │   ├── services/
│   │   │   ├── assistant.service.js
│   │   │   └── sentiment.service.js
│   │   ├── prisma/
│   │   │   └── client.js
│   │   ├── socket.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── conversations/
│   │   │   │   ├── ConversationList.vue
│   │   │   │   ├── ConversationItem.vue
│   │   │   │   └── ConversationFilters.vue
│   │   │   ├── layout/
│   │   │   │   └── AppNavbar.vue
│   │   │   ├── messages/
│   │   │   │   ├── MessageThread.vue
│   │   │   │   ├── ConversationHeader.vue
│   │   │   │   ├── MessageBubble.vue
│   │   │   │   └── MessageInput.vue
│   │   │   ├── dashboard/
│   │   │   │   ├── AgentTable.vue
│   │   │   │   ├── AssistantPanel.vue
│   │   │   │   ├── KpiCard.vue
│   │   │   │   └── UserConversationsModal.vue
│   │   │   ├── labels/
│   │   │   │   └── LabelFormModal.vue
│   │   │   └── users/
│   │   │       ├── UserTable.vue
│   │   │       └── UserFormModal.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── socket/
│   │   │   └── index.js
│   │   ├── stores/
│   │   │   ├── auth.js
│   │   │   ├── conversations.js
│   │   │   ├── labels.js
│   │   │   ├── stats.js
│   │   │   └── theme.js
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── MainView.vue
│   │   │   ├── DashboardView.vue
│   │   │   ├── LabelsView.vue
│   │   │   ├── UsersView.vue
│   │   │   └── ProfileView.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── .env
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── postman/
```

------------------------------------------------------------------------

# 8. API REST — endpoints

## Auth

| Método | Ruta | Acceso |
|--------|------|--------|
| `POST` | `/auth/login` | Público (rate limit 3/15 s) |

## Perfil propio

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/me` | JWT |
| `POST` | `/me/avatar` | JWT |

## Conversaciones

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/conversations` | JWT + RBAC |
| `GET` | `/conversations/:id` | JWT + RBAC |
| `POST` | `/conversations/:id/assign-to-me` | JWT (AGENT) |
| `POST` | `/conversations/:id/assign` | JWT (SUPERVISOR / ADMIN) |
| `POST` | `/conversations/:id/unassign` | JWT |
| `PATCH` | `/conversations/:id/status` | JWT |
| `POST` | `/conversations/:id/read` | JWT |
| `PATCH` | `/conversations/:id/contact` | JWT |

## Mensajes

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/conversations/:id/messages` | JWT |
| `POST` | `/conversations/:id/messages` | JWT |

## Etiquetas

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/labels` | JWT |
| `POST` | `/labels` | JWT + ADMIN |
| `PATCH` | `/labels/:id` | JWT + ADMIN |
| `DELETE` | `/labels/:id` | JWT + ADMIN |
| `POST` | `/conversations/:id/labels` | JWT |
| `DELETE` | `/conversations/:id/labels/:labelId` | JWT |

`POST /labels` body: `{ "name": "Urgente", "color": "#ef4444" }` — color debe ser un hex de 6 dígitos.  
`POST /conversations/:id/labels` body: `{ "labelId": 3 }` — máximo 5 etiquetas por conversación.  
`DELETE /labels/:id` realiza baja lógica y elimina en cascada todos los registros de `ConversationLabel`.

## Usuarios

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/users` | JWT + ADMIN |
| `POST` | `/users` | JWT + ADMIN |
| `PATCH` | `/users/:id` | JWT + ADMIN |
| `DELETE` | `/users/:id` | JWT + ADMIN |

## Estadísticas

| Método | Ruta | Acceso |
|--------|------|--------|
| `GET` | `/stats` | JWT + SUPERVISOR / ADMIN |
| `GET` | `/stats/users/:userId/conversations` | JWT + SUPERVISOR / ADMIN |
| `GET` | `/stats/labels` | JWT + SUPERVISOR / ADMIN |

`GET /stats/labels` acepta query param opcional `?status=OPEN|PENDING|CLOSED`. Devuelve `{ labelKpis: [{ id, name, color, count }], conversationsWithAnyLabel: N }`.

## Asistente IA

| Método | Ruta | Acceso |
|--------|------|--------|
| `POST` | `/assistant` | JWT + SUPERVISOR / ADMIN (rate limit 20 req/min) |

**Body:**
```json
{
  "message": "¿Cuántas conversaciones hay abiertas?",
  "history": [
    { "role": "user", "content": "...", "sql": null },
    { "role": "assistant", "content": "...", "sql": "SELECT ..." }
  ]
}
```

**Respuesta:**
```json
{
  "ok": true,
  "answer": "Hay 12 conversaciones abiertas en este momento.",
  "sql": "SELECT COUNT(*) AS total FROM Conversation c WHERE c.status = 'OPEN'",
  "ms": 2341
}
```

## Webhook

| Método | Ruta | Acceso |
|--------|------|--------|
| `POST` | `/webhooks/provider` | `X-Webhook-Secret` |

------------------------------------------------------------------------

# 9. WebSockets

Conexión autenticada con JWT. Al conectar se asignan automáticamente las rooms:

- `user:{id}` — notificaciones del usuario concreto
- `role:{AGENT|SUPERVISOR|ADMIN}` — notificaciones por rol

El cliente puede unirse a una room de conversación emitiendo `conversation:join`.

**Eventos servidor → cliente:**

| Evento | Cuándo se emite |
|--------|----------------|
| `message:new` | Nuevo mensaje en una conversación |
| `message:update` | Actualización de estado de un mensaje |
| `conversation:assign` | Cambio de asignación |
| `conversation:statusUpdate` | Cambio de estado de la conversación |

------------------------------------------------------------------------

# 10. Modelos de base de datos

## User

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Int | PK |
| `email` | String | Único |
| `password` | String | Hash scrypt |
| `role` | Enum | `ADMIN` / `SUPERVISOR` / `AGENT` |
| `firstName` | String | |
| `lastName` | String | |
| `avatarUrl` | String? | |
| `active` | Boolean | Baja lógica |

## Conversation

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Int | PK |
| `externalId` | String | ID del proveedor |
| `customerPhone` | String | |
| `contactName` | String? | Editable desde el frontend |
| `status` | Enum | `OPEN` / `PENDING` / `CLOSED` |
| `assignedToId` | Int? | FK → User |

## Message

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Int | PK |
| `direction` | Enum | `IN` / `OUT` |
| `state` | Enum | `PENDING` / `SENT` / `RECEIVED` / `READ` / `ERROR` / `DELETED` |
| `text` | String? | Null en mensajes multimedia |
| `sentiment` | String? | `positive` / `neutral` / `negative` / `angry` — solo mensajes `IN` |
| `occurredAt` | DateTime | Fecha real del mensaje |
| `conversationId` | Int | FK → Conversation |
| `sentById` | Int? | FK → User |

El campo `sentiment` se calcula automáticamente al recibir cada mensaje entrante mediante el analizador propio `sentiment.service.js` (ver sección 15).

## Label

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Int | PK |
| `name` | String | Único |
| `color` | String | Hex (#rrggbb) |
| `active` | Boolean | Baja lógica |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

## ConversationLabel

Tabla puente N:M entre `Conversation` y `Label`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Int | PK |
| `conversationId` | Int | FK → Conversation (cascade delete) |
| `labelId` | Int | FK → Label (cascade delete) |
| `createdAt` | DateTime | |

Restricción única: `[conversationId, labelId]` (no se puede asignar la misma etiqueta dos veces a la misma conversación). Máximo **5 etiquetas por conversación** validado en el backend.

## ConversationUserState

Rastrea `lastReadAt` por usuario y conversación, para calcular mensajes no leídos.

------------------------------------------------------------------------

# 11. Seguridad

- Contraseñas hasheadas con `crypto.scrypt` + comparación en tiempo constante (`timingSafeEqual`)
- Webhook autenticado con `X-Webhook-Secret` comparado en tiempo constante
- JWT validado con algoritmo explícito (`HS256`)
- RBAC en todos los endpoints protegidos
- Rate limit en `/auth/login` (3 intentos / 15 s)
- CORS restringido al origen configurado en `CORS_ORIGIN`

------------------------------------------------------------------------

# 12. Webhook del proveedor

```
POST /webhooks/provider
X-Webhook-Secret: TU_SECRETO
```

Eventos soportados:

- `message.incomming` — mensaje entrante
- `message.outgoing` — mensaje saliente
- `message.state_updated` — actualización de estado

El webhook responde `200` inmediatamente y procesa el evento en `setImmediate()`.

------------------------------------------------------------------------

# 13. Exponer el webhook con Cloudflare Tunnel

```bash
# Login
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create powerchat-webhook

# Asociar dominio
cloudflared tunnel route dns powerchat-webhook webhook.tudominio.com

# Ejecutar
cloudflared tunnel run powerchat-webhook
```

URL a configurar en el proveedor:

```
https://webhook.tudominio.com/webhooks/provider
```

------------------------------------------------------------------------

# 14. Dependencias

## Backend

| Paquete | Por qué se usa |
|---------|----------------|
| `express` | Framework HTTP (rutas, middlewares, controladores) |
| `@prisma/client` | ORM para MySQL |
| `jsonwebtoken` | Generación y verificación de JWT |
| `socket.io` | Comunicación en tiempo real |
| `cors` | Permite peticiones desde el frontend |
| `dotenv` | Variables de entorno |
| `express-rate-limit` | Limita intentos de login y peticiones al asistente IA |
| `multer` | Subida de archivos (avatares) |
| `sentiment.service.js` *(propio)* | Análisis de sentimiento en español con diccionario de palabras y frases |
| `nodemon` *(dev)* | Reinicio automático en desarrollo |
| `prisma` *(dev)* | CLI para schema, migraciones y seed |

## Frontend

| Paquete | Por qué se usa |
|---------|----------------|
| `vue` | Framework reactivo (SPA) |
| `vue-router` | Navegación entre vistas con guards por rol |
| `pinia` | Estado global (auth, conversaciones, tema) |
| `axios` | Cliente HTTP para la API REST |
| `socket.io-client` | Eventos en tiempo real |
| `chart.js` | Motor de gráficos (donut, líneas) |
| `vue-chartjs` | Wrapper Vue para Chart.js |
| `vite` *(dev)* | Bundler para desarrollo |
| `@vitejs/plugin-vue` *(dev)* | Procesado de componentes `.vue` |
| `tailwindcss` *(dev)* | Estilos responsive |
| `postcss` + `autoprefixer` *(dev)* | Procesado de CSS |

------------------------------------------------------------------------

# 15. Asistente IA — arquitectura

## Funcionamiento

El usuario escribe una pregunta en español en el panel de chat lateral. El backend ejecuta dos llamadas secuenciales al modelo de lenguaje alojado en RunPod:

```
Pregunta → RunPod (SQL) → MySQL → RunPod (resumen) → Respuesta
```

1. **Primera llamada (Text-to-SQL):** envía la pregunta junto con el historial completo de la conversación y el esquema de la BD. El modelo devuelve una query MySQL SELECT.
2. **Validación y sanitización:** se elimina markdown, comentarios SQL y texto extra; se verifica que sea un SELECT; se corrigen alias con guión bajo; se bloquean palabras clave peligrosas.
3. **Ejecución:** `prisma.$queryRawUnsafe()`. Si falla por `ONLY_FULL_GROUP_BY` (error 1055), se reintenta envolviendo columnas no agregadas en `ANY_VALUE()`.
4. **Segunda llamada (resumen):** si hay resultados, el modelo los convierte a lenguaje natural.
5. **Contexto conversacional:** el SQL generado y la respuesta en lenguaje natural de cada turno se incluyen en el historial del turno siguiente, permitiendo preguntas de seguimiento naturales.

## Análisis de sentimiento

Cada mensaje entrante (`direction = IN`) recibe automáticamente una etiqueta de sentimiento calculada por el servicio propio `backend/src/services/sentiment.service.js`, sin dependencias externas.

### Cómo funciona

1. **Normalización:** el texto se convierte a minúsculas, se eliminan tildes (NFD) y la puntuación se reemplaza por espacios.
2. **Detección de frases (multi-palabra):** se comprueban ~60 expresiones ordenadas de mayor a menor longitud para capturar el match más específico primero (ej. `"llevo días esperando"`, `"madre mía"`, `"muchas gracias"`).
3. **Detección de palabras individuales:** los tokens resultantes se comparan contra un diccionario de ~100 palabras en español (ej. `furioso`, `enfadado`, `excelente`, `gracias`).
4. **Puntuación acumulada:** cada coincidencia suma su score (−5 a +5) al total.
5. **Etiqueta final:**

| Score acumulado | Etiqueta |
|-----------------|----------|
| ≤ −5 | `angry` |
| −4 a −2 | `negative` |
| −1 a +1 | `neutral` |
| ≥ +2 | `positive` |

### Ejemplos de cobertura

| Expresión | Score | Etiqueta |
|-----------|-------|----------|
| "llevo días esperando" | −5 | `angry` |
| "estoy muy cabreado" | −4 | `angry` |
| "madre mía, qué lentos" | −6 | `angry` |
| "estoy enfadado" | −3 | `negative` |
| "muchas gracias, muy amable" | +8 | `positive` |
| "ok" | +1 | `neutral` |

El campo `Message.sentiment` queda disponible para consultas del asistente ("¿cuántos mensajes negativos hubo hoy?").

## Configuración del endpoint RunPod

El endpoint debe servir Ollama con el modelo `qwen2.5-coder:14b` (recomendado) o `qwen2.5-coder:32b`.

Variables de entorno del worker de RunPod:

```
OLLAMA_MODEL_NAME=qwen2.5-coder:14b
MAX_CONCURRENCY=8
```

Configuración recomendada del endpoint:

- **Min Workers:** 1 (evita cold starts de 30-40 s)
- **Idle timeout:** 5 min
- **Execution timeout:** 600 s

## Archivos principales por funcionalidad

### Etiquetas

| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/labels.controller.js` | CRUD de etiquetas: listar, crear, editar, baja lógica |
| `backend/src/routes/labels.routes.js` | Rutas `GET/POST/PATCH/DELETE /labels` |
| `frontend/src/stores/labels.js` | Pinia store: fetch, create, update, delete con orden por nombre |
| `frontend/src/views/LabelsView.vue` | Vista de gestión de etiquetas (tabla + modal) |
| `frontend/src/components/labels/LabelFormModal.vue` | Modal crear/editar: nombre, paleta de 12 colores, vista previa |

### Asistente IA

| Archivo | Descripción |
|---------|-------------|
| `backend/src/services/assistant.service.js` | Lógica principal: Text-to-SQL, validación, ejecución, resumen, contexto dinámico |
| `backend/src/controllers/assistant.controller.js` | Controlador REST, validación de entrada, manejo de errores |
| `backend/src/routes/assistant.routes.js` | Ruta `POST /assistant` con rate limit y RBAC |
| `frontend/src/components/dashboard/AssistantPanel.vue` | Panel de chat lateral con overlay, chips de sugerencias e indicador de cold start |

### Análisis de sentimiento

| Archivo | Descripción |
|---------|-------------|
| `backend/src/services/sentiment.service.js` | Analizador propio: diccionario de ~60 frases y ~100 palabras en español, sin dependencias externas |

------------------------------------------------------------------------

# 16. Flujo de mensajes

**Mensaje entrante:**
```
Cliente WhatsApp → Proveedor → Webhook → BD → Socket.IO → Frontend
```

**Mensaje saliente:**
```
Frontend → API → Proveedor → Webhook → BD → Socket.IO → Frontend
```

------------------------------------------------------------------------

# 17. Comandos de referencia rápida

```bash
# Arrancar backend (desde backend/)
npm run dev

# Arrancar frontend (desde frontend/)
npm run dev

# Generar Prisma Client
npx prisma generate

# Migraciones
npx prisma migrate dev

# Seed manual (producción)
npx prisma db seed

# Prisma Studio
npx prisma studio

# Cloudflare Tunnel
cloudflared tunnel run powerchat-webhook
```
