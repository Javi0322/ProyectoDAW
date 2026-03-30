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

### Dashboard de métricas *(SUPERVISOR y ADMIN)*

- KPIs en tiempo real agrupados en cuatro secciones: **Por asignación**, **Por estado**, **Por día** y **Por usuario**
- Filtro de rango de fechas con presets rápidos (hoy, 7 d, 30 d) y selector personalizado
- Polling automático cada 60 segundos (sin WebSocket)
- Gráfico donut de conversaciones por estado (OPEN / PENDING / CLOSED)
- Gráficos de líneas: conversaciones nuevas por día y mensajes por día (IN/OUT)
- Tabla de rendimiento por usuario: conversaciones abiertas, pendientes, resueltas y mensajes enviados en el período
- Fila virtual "Sin asignar" para conversaciones sin agente
- Panel lateral de drill-down: al clicar en un usuario se listan las conversaciones en las que ha interactuado; botón "Abrir →" navega al chat con scroll automático al mensaje más reciente

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
```

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
│   │   │   └── stats.controller.js
│   │   ├── routes/
│   │   │   └── stats.routes.js
│   │   ├── middleware/
│   │   ├── services/
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
│   │   │   │   ├── KpiCard.vue
│   │   │   │   └── UserConversationsModal.vue
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
│   │   │   ├── stats.js
│   │   │   └── theme.js
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── MainView.vue
│   │   │   ├── DashboardView.vue
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
| `text` | String | |
| `conversationId` | Int | FK → Conversation |
| `sentById` | Int? | FK → User |

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
| `express-rate-limit` | Limita intentos de login |
| `multer` | Subida de archivos (avatares) |
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

# 15. Flujo de mensajes

**Mensaje entrante:**
```
Cliente WhatsApp → Proveedor → Webhook → BD → Socket.IO → Frontend
```

**Mensaje saliente:**
```
Frontend → API → Proveedor → Webhook → BD → Socket.IO → Frontend
```

------------------------------------------------------------------------

# 16. Comandos de referencia rápida

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
