# PowerChat - Inbox WhatsApp Multiagente

Aplicación backend tipo **Inbox de mensajería WhatsApp multiagente**,
conectada a un proveedor externo que:

-   Permite enviar mensajes por API
-   Envía eventos por **webhook**
-   Notifica mensajes entrantes, salientes y actualizaciones de estado por websocket
-   Está construido con una arquitectura tipo **MVC**.

------------------------------------------------------------------------

## Stack tecnológico

### Backend

-   Node.js
-   Express v5
-   Prisma ORM
-   MySQL

### Frontend

-   Vite + Vue 3
-   Pinia (gestión de estado)
-   Tailwind CSS
-   Socket.IO client

### Autenticación

-   JWT (24h)

### Seguridad

-   Hash de contraseñas con `crypto.scrypt`
-   Webhook protegido con header secreto

### Tiempo real

-   Socket.IO v4

### Testing

-   Postman (colección incluida en /postman/collections)

### Exposición pública local

-   Cloudflare Tunnel

------------------------------------------------------------------------

## Coleccion Postman

En la raiz del proyecto encontraras el archivo `PowerChat.postman_collection.json`
con todas las peticiones de la API listas para importar en Postman.

Incluye:

-   Auth (login con guardado automatico del token)
-   Me (perfil propio, subida de avatar)
-   Conversaciones (listar, ver, asignar, mensajes, estado, leer, contacto)
-   Usuarios (CRUD completo, requiere rol ADMIN)
-   Webhooks (simulacion de eventos del proveedor)

Para importarla: abre Postman → **Import** → selecciona el archivo.

------------------------------------------------------------------------

# 1. Requisitos previos

Tener instalado:

-   Node.js
-   npm
-   MySQL
-   Git
-   Cloudflared
-   Postman

------------------------------------------------------------------------

# 2. Instalación del proyecto

## Clonar repositorio

``` bash
git clone <URL_DEL_REPO>
cd ProyectoDAW
```

## Entrar al backend

``` bash
cd backend
```

## Instalar dependencias

``` bash
npm install
```

------------------------------------------------------------------------

# 3. Variables de entorno

Crear un archivo `.env` dentro de `backend/`.

Ejemplo:

    PORT=3000

    DATABASE_URL="mysql://root:root@localhost:3306/proyectodaw"

    JWT_ACCESS_SECRET=pon_aqui_un_secreto_largo

    WEBHOOK_SECRET=pon_aqui_un_secreto_fijo_para_el_webhook

    MESSAGE_API_BASE_URL=https://message.testmotorflash.com
    MESSAGE_API_USERNAME=usuario_del_proveedor
    MESSAGE_API_PASSWORD=password_del_proveedor
    MESSAGE_API_FROM=+34615661316

    CORS_ORIGIN=http://localhost:5173

------------------------------------------------------------------------

# 4. Base de datos

Crear la base de datos en MySQL:

``` sql
CREATE DATABASE proyectodaw
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

------------------------------------------------------------------------

# 5. Prisma

## Generar Prisma Client

``` bash
npx prisma generate --schema=prisma/schema.prisma
```

## Ejecutar migraciones

``` bash
npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

## Seed — usuario por defecto

El seed crea el usuario inicial necesario para hacer login:

    Email:    user@gmail.com
    Password: user1234
    Rol:      ADMIN

**En desarrollo** (`migrate dev`), el seed se ejecuta automáticamente al final de las migraciones. No hace falta lanzarlo a mano.

**En producción** (`migrate deploy`), el seed NO se ejecuta automáticamente. Hay que lanzarlo una vez de forma manual:

``` bash
npx prisma db seed
```

El seed es idempotente: si el usuario ya existe no se duplica.

## Abrir Prisma Studio

``` bash
npx prisma studio --schema=prisma/schema.prisma
```

------------------------------------------------------------------------

# 6. Arrancar el proyecto

## Backend

Desde `backend/`:

``` bash
npm run dev
```

Servidor disponible en:

    http://localhost:3000

Ruta de prueba:

    http://localhost:3000/health

## Frontend

Desde `frontend/`:

``` bash
npm install
npm run dev
```

Aplicación disponible en:

    http://localhost:5173

------------------------------------------------------------------------

# 7. Estructura del proyecto

    backend/
     ├─ prisma/
     │   ├─ schema.prisma
     │   └─ migrations/
     │
     ├─ src/
     │   ├─ controllers/
     │   ├─ routes/
     │   ├─ middleware/
     │   ├─ services/
     │   ├─ prisma/
     │   │   └─ client.js
     │   ├─ socket.js
     │   └─ server.js
     │
     ├─ .env
     └─ package.json

    frontend/
     ├─ src/
     │   ├─ api/
     │   ├─ components/
     │   ├─ router/
     │   ├─ socket/
     │   ├─ stores/
     │   ├─ views/
     │   ├─ App.vue
     │   └─ main.js
     │
     ├─ index.html
     ├─ vite.config.js
     └─ package.json

------------------------------------------------------------------------

# 8. Funcionalidades implementadas

## Auth

-   `POST /auth/login`

## Me

-   `GET /me`
-   `POST /me/avatar`

## Conversaciones

-   `GET /conversations`
-   `GET /conversations/:id`
-   `POST /conversations/:id/assign-to-me`
-   `POST /conversations/:id/assign`
-   `POST /conversations/:id/unassign`
-   `PATCH /conversations/:id/status`
-   `POST /conversations/:id/read`
-   `PATCH /conversations/:id/contact`

## Mensajes

-   `GET /conversations/:id/messages`
-   `POST /conversations/:id/messages`

## Usuarios (requiere rol ADMIN)

-   `GET /users`
-   `POST /users`
-   `PATCH /users/:id`
-   `DELETE /users/:id`

## Webhook

-   `POST /webhooks/provider`

## Tiempo real

-   Socket.IO con autenticación por JWT

------------------------------------------------------------------------

# 9. Modelos principales

## User

-   id
-   email
-   password
-   role (`ADMIN` / `SUPERVISOR` / `AGENT`)
-   firstName
-   lastName
-   avatarUrl
-   active
-   createdAt
-   updatedAt

## Conversation

-   id
-   externalId
-   customerPhone
-   contactName
-   status (`OPEN` / `PENDING` / `CLOSED`)
-   assignedToId
-   lastMessageAt
-   lastMessageText
-   createdAt
-   updatedAt

## Message

-   id
-   externalId
-   direction (`IN` / `OUT`)
-   state (`PENDING` / `SENT` / `RECEIVED` / `READ` / `ERROR` / `DELETED`)
-   text
-   occurredAt
-   stateAt
-   conversationId
-   sentById
-   createdAt

## ConversationUserState

-   id
-   conversationId
-   userId
-   lastReadAt

------------------------------------------------------------------------

# 10. Dependencias

## Backend

| Paquete | Por qué se usa |
|---------|---------------|
| `express` | Framework HTTP para definir rutas, middlewares y controladores (MVC) |
| `@prisma/client` | Cliente ORM para interactuar con MySQL de forma tipada y segura |
| `jsonwebtoken` | Generación y verificación de tokens JWT para autenticación |
| `socket.io` | Comunicación bidireccional en tiempo real (mensajes entrantes, estados) |
| `cors` | Permite peticiones desde el frontend en `localhost:5173` |
| `dotenv` | Carga las variables de entorno desde el archivo `.env` |
| `express-rate-limit` | Limita intentos de login (3 por cada 15s) para evitar fuerza bruta |
| `multer` | Gestiona la subida de archivos (avatares de usuario) |

### DevDependencies (backend)

| Paquete | Por qué se usa |
|---------|---------------|
| `nodemon` | Reinicia el servidor automáticamente al guardar cambios durante el desarrollo |
| `prisma` | CLI para gestionar el schema, migraciones y seed de la base de datos |

## Frontend

| Paquete | Por qué se usa |
|---------|---------------|
| `vue` | Framework reactivo para construir la interfaz de usuario (SPA) |
| `vue-router` | Gestiona la navegación entre vistas (login, bandeja, perfil, usuarios) |
| `pinia` | Store de estado global (auth, conversaciones, tema) |
| `axios` | Cliente HTTP para llamar a la API REST del backend |
| `socket.io-client` | Conecta el frontend al servidor Socket.IO para recibir eventos en tiempo real |

### DevDependencies (frontend)

| Paquete | Por qué se usa |
|---------|---------------|
| `vite` | Bundler ultrarrápido que sirve el frontend en desarrollo |
| `@vitejs/plugin-vue` | Plugin de Vite para procesar componentes `.vue` |
| `tailwindcss` | Framework CSS de utilidades para estilizar los componentes |
| `postcss` + `autoprefixer` | Procesado de CSS necesario para que Tailwind funcione correctamente |

------------------------------------------------------------------------

# 11. Webhook del proveedor

Endpoint:

    POST /webhooks/provider

Eventos soportados:

-   `message.incomming`
-   `message.outgoing`
-   `message.state_updated`

------------------------------------------------------------------------

# 12. Seguridad del webhook

Header requerido:

    X-Webhook-Secret: TU_SECRETO

Variable de entorno:

    WEBHOOK_SECRET=tu_secreto

------------------------------------------------------------------------

# 13. Exponer el webhook con Cloudflare Tunnel

## Login

``` bash
cloudflared tunnel login
```

## Crear túnel

``` bash
cloudflared tunnel create powerchat-webhook
```

## Asociar DNS

``` bash
cloudflared tunnel route dns powerchat-webhook webhook.tudominio.com
```

## Ejecutar túnel

``` bash
cloudflared tunnel run powerchat-webhook
```

------------------------------------------------------------------------

# 14. Configuración del proveedor

Si quieres probar el envío de mensajes ahy que configurarlo en el proveedor. (Avisame por correo con estas credenciales para configurarlas, no funciona con localhost)

Webhook URL:

    https://webhook.tudominio.com/webhooks/provider

Header requerido:

    X-Webhook-Secret: TU_SECRETO

------------------------------------------------------------------------

# 15. Comandos útiles

Arrancar backend:

``` bash
npm run dev
```

Generar Prisma Client:

``` bash
npx prisma generate
```

Migraciones:

``` bash
npx prisma migrate dev
```

Prisma Studio:

``` bash
npx prisma studio
```

Arrancar Cloudflare Tunnel:

``` bash
cloudflared tunnel run powerchat-webhook
```

------------------------------------------------------------------------

# 16. Flujo de funcionamiento

### Mensaje entrante

Cliente → Proveedor → Webhook → Base de datos → Socket.IO → Frontend

### Mensaje saliente

Frontend → API → Proveedor → Webhook → Base de datos → Socket.IO →
Frontend

------------------------------------------------------------------------

# 17. En proceso / mejoras

-   Refresh tokens
-   Frontend SPA completo
-   Métricas de conversación
-   Dashboard de supervisión
-   Despliegue en producción
