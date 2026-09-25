const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function formatUpdated(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'Recién'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ayer'
  if (d < 30) return `Hace ${d} días`
  const date = new Date(iso)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export function isRecent(iso: string) {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000
}

export function formatDue(iso: string | null) {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return 'Mañana'
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function shortName(nombre: string) {
  const words = nombre.trim().split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return initials || 'TB'
}