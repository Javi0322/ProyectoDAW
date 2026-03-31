export function colorFromId(id) {
  const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
  return palette[Number(id ?? 0) % palette.length]
}

export function safeImageUrl(url) {
  if (!url) return null
  if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/')) return url
  return null
}

export function userName(user) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return full || `Usuario #${user.userId ?? user.id}`
}

export function initials(user) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return full ? full.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'
}

export function roleBadgeClass(role) {
  if (role === 'ADMIN')      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400'
  if (role === 'SUPERVISOR') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
  return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`
}

export function isoToDisplay(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}-${m}-${y}`
}
