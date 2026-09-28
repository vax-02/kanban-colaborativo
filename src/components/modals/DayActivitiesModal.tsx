import { useState } from 'react'
import { CalendarClock, Check, Flag } from 'lucide-react'
import Modal from '../Modal'
import type { Prioridad } from '../../lib/types'

export type DayTask = {
  id: string
  title: string
  boardName: string
  prioridad: Prioridad
}

type Props = {
  date: Date
  items: DayTask[]
  onMarkDone: (task: DayTask) => Promise<void>
  onPostpone: (task: DayTask, newDate: Date) => Promise<void>
  onClose: () => void
}

const PRIORITY_COLOR: Record<Prioridad, string> = {
  ALTA: '#ef4444',
  MEDIA: '#f59e0b',
  BAJA: '#64748b',
}

const PRIORITY_LABEL: Record<Prioridad, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function DayActivitiesModal({
  date,
  items,
  onMarkDone,
  onPostpone,
  onClose,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [postponingId, setPostponingId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return toISODate(d)
  })
  const [error, setError] = useState<string | null>(null)

  const dateLabel = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const markDone = async (task: DayTask) => {
    setBusyId(task.id)
    setError(null)
    try {
      await onMarkDone(task)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo marcar la tarea como realizada',
      )
    } finally {
      setBusyId(null)
    }
  }

  const postpone = async (task: DayTask) => {
    if (!newDate) return
    setBusyId(task.id)
    setError(null)
    try {
      const [y, m, d] = newDate.split('-').map(Number)
      await onPostpone(task, new Date(y, m - 1, d))
      setPostponingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo posponer la tarea')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal
      title="Actividades del día"
      subtitle={`${dateLabel} · ${items.length} tarea${items.length === 1 ? '' : 's'}`}
      icon={<CalendarClock className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="btn-ghost">
          Cerrar
        </button>
      }
    >
      <div className="space-y-2.5">
        {items.map((task) => {
          const busy = busyId === task.id
          const postponing = postponingId === task.id
          return (
            <div key={task.id} className="rounded-xl border border-ink-200 bg-surface p-3">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: PRIORITY_COLOR[task.prioridad] }}
                >
                  <Flag className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{task.title}</p>
                  <p className="truncate text-xs text-ink-400">{task.boardName}</p>
                </div>
                <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                  {PRIORITY_LABEL[task.prioridad]}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void markDone(task)}
                  disabled={busy}
                  className="btn-soft"
                >
                  <Check className="h-4 w-4" />
                  Realizada
                </button>
                <button
                  type="button"
                  onClick={() => setPostponingId((cur) => (cur === task.id ? null : task.id))}
                  disabled={busy}
                  className="btn-ghost"
                >
                  <CalendarClock className="h-4 w-4" />
                  Posponer
                </button>
              </div>

              {postponing && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 p-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => void postpone(task)}
                    disabled={busy || !newDate}
                    className="btn-primary"
                  >
                    {busy ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostponingId(null)}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}