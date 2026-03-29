import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  if (socket && socket.connected) {
    return socket
  }

  const token = localStorage.getItem('auth_token')
  if (!token) {
    if (import.meta.env.DEV) console.warn('[socket] No auth token found, skipping connection')
    return null
  }

  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('[socket] Connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    if (import.meta.env.DEV) console.error('[socket] Connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    if (import.meta.env.DEV) console.log('[socket] Disconnected:', reason)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
