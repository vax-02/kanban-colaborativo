import type { Prioridad, TaskDto } from './types'

export type DueFilter = 'any' | 'today' | 'week' | 'overdue' | 'none'

export type TaskFilters = {
  boardId: string | null
  members: string[]
  labels: string[]
  prio: Prioridad | null
  due: DueFilter
  showDone: boolean
}

export const EMPTY_FILTERS: TaskFilters = {
  boardId: null,
  members: [],
  labels: [],
  prio: null,
  due: 'any',
  showDone: true,
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function taskMatchesFilters(t: TaskDto, f: TaskFilters): boolean {
  if (f.members.length > 0 && !t.asignaciones.some((a) => f.members.includes(a.id))) return false
  if (f.labels.length > 0 && !t.etiquetas.some((e) => f.labels.includes(e.texto))) return false
  if (f.prio && t.prioridad !== f.prio) return false

  if (f.due === 'none') {
    if (t.fechaVencimiento) return false
  } else if (f.due !== 'any') {
    if (!t.fechaVencimiento) return false
    const hoy = startOfDay(new Date())
    const venc = startOfDay(new Date(t.fechaVencimiento))
    if (f.due === 'today' && venc.getTime() !== hoy.getTime()) return false
    if (f.due === 'overdue' && venc.getTime() >= hoy.getTime()) return false
    if (f.due === 'week') {
      const diff = venc.getTime() - hoy.getTime()
      if (diff < 0 || diff > 6 * 86400000) return false
    }
  }
  return true
}

export function isDoneColumn(columna: { esFinalizada: boolean }): boolean {
  return columna.esFinalizada
}

export function countActiveFilters(f: TaskFilters): number {
  return (
    f.members.length +
    f.labels.length +
    (f.prio ? 1 : 0) +
    (f.due !== 'any' ? 1 : 0) +
    (f.showDone ? 0 : 1)
  )
}

export function filtersActive(f: TaskFilters): boolean {
  return countActiveFilters(f) > 0
}