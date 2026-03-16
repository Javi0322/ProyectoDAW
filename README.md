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
-   Express
-   Prisma ORM
-   MySQL

### Autenticación

-   JWT

### Seguridad

-   Hash de contraseñas con `crypto.scrypt`
-   Webhook protegido con header secreto

### Tiempo real

-   Socket.IO

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
-   Conversaciones (listar, ver, asignar, mensajes, estado, leer)
-   Webhooks (simulacion de eventos del proveedor)
-   Instrucciones para probar el WebSocket con Socket.IO
-   Falta por añadir - Usuarios (CRUD completo)

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

Desde `backend/`:

``` bash
npm run dev
```

Servidor disponible en:

    http://localhost:3000

Ruta de prueba:

    http://localhost:3000/health

------------------------------------------------------------------------

# 7. Estructura del backend

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
     ├─ package.json
     └─ README.md

------------------------------------------------------------------------

# 8. Funcionalidades implementadas

## Auth

-   `POST /auth/login`
-   `GET /me`

## Conversaciones

-   `GET /conversations`
-   `GET /conversations/:id`
-   `POST /conversations/:id/assign-to-me`
-   `POST /conversations/:id/assign`
-   `POST /conversations/:id/unassign`
-   `PATCH /conversations/:id/status`

## Mensajes

-   `GET /conversations/:id/messages`
-   `POST /conversations/:id/messages`

## Usuarios

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
-   role
-   firstName
-   lastName
-   active
-   createdAt
-   updatedAt

## Conversation

-   id
-   externalId
-   customerPhone
-   status
-   assignedToId
-   lastMessageAt
-   lastMessageText
-   createdAt
-   updatedAt

## Message

-   id
-   externalId
-   direction
-   state
-   text
-   occurredAt
-   stateAt
-   conversationId
-   createdAt

------------------------------------------------------------------------

# 10. Webhook del proveedor

Endpoint:

    POST /webhooks/provider

Eventos soportados:

-   `message.incomming`
-   `message.outgoing`
-   `message.state_updated`

------------------------------------------------------------------------

# 11. Seguridad del webhook

Header requerido:

    X-Webhook-Secret: TU_SECRETO

Variable de entorno:

    WEBHOOK_SECRET=tu_secreto

------------------------------------------------------------------------

# 12. Exponer el webhook con Cloudflare Tunnel

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

# 13. Configuración del proveedor

Webhook URL:

    https://webhook.tudominio.com/webhooks/provider

Header requerido:

    X-Webhook-Secret: TU_SECRETO

Si quieres probar el envío de mensajes hay que configurarlo en el proveedor. (Avisame por correo con estas crendenciales para configurarlas, no funciona con localhost )
------------------------------------------------------------------------

# 14. Comandos útiles

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

# 15. Flujo de funcionamiento

### Mensaje entrante

Cliente → Proveedor → Webhook → Base de datos → Socket.IO → Frontend

### Mensaje saliente

Frontend → API → Proveedor → Webhook → Base de datos → Socket.IO →
Frontend

------------------------------------------------------------------------

# 16. En proceso / mejoras

-   Refresh tokens
-   Frontend SPA completo
-   Métricas de conversación
-   Dashboard de supervisión
-   Despliegue en producción
