import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Flag,
  ListTodo,
  LoaderCircle,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getToken } from '../lib/api'
import { useBoardsStore } from '../store/boardsStore'
import { useAuthStore } from '../store/authStore'
import type { Prioridad, TaskDto } from '../lib/types'

type Tab = 'todas' | 'pendientes' | 'completadas'

const priorityLabel: Record<Prioridad, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

const priorityColor: Record<Prioridad, string> = {
  ALTA: '#ef4444',
  MEDIA: '#f59e0b',
  BAJA: '#64748b',
}

type MyRow = {
  task: TaskDto
  boardId: string
  boardName: string
  boardColor: string
  column: string
  done: boolean
}

function formatDue(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const due = new Date(iso)
  if (Number.isNaN(due.getTime())) return 'Sin fecha'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(due)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays === -1) return 'Ayer'
  return due.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function MyTasksPage() {
  const [tab, setTab] = useState<Tab>('pendientes')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<MyRow[]>([])
  const [loading, setLoading] = useState(true)
  const me = useAuthStore((s) => s.user)
  const loadBoards = useBoardsStore((s) => s.loadBoards)
  const getBoard = useBoardsStore((s) => s.getBoard)

  useEffect(() => {
    let active = true

    ;(async () => {
      if (!getToken()) {
        if (active) setLoading(false)
        return
      }
      try {
        if (!useBoardsStore.getState().boards.length) await loadBoards()
        const list = useBoardsStore.getState().boards
        const details = await Promise.all(list.map((b) => getBoard(b.id)))
        if (!active) return

        const collected: MyRow[] = []
        for (const b of details) {
          for (const col of b.columnas) {
            for (const task of col.tareas) {
              const assigned = me
                ? task.asignaciones.some((m) => m.id === me.id)
                : false
              if (!assigned) continue
              collected.push({
                task,
                boardId: b.id,
                boardName: b.nombre,
                boardColor: b.color,
                column: col.titulo,
                done: col.titulo.toUpperCase() === 'TERMINADO',
              })
            }
          }
        }
        setRows(collected)
      } catch {
        // sin conexión o error: la lista queda vacía
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [me, loadBoards, getBoard])

  const list = useMemo(() => {
    return rows.filter((r) => {
      const matchTab =
        tab === 'todas' || (tab === 'pendientes' && !r.done) || (tab === 'completadas' && r.done)
      const matchQuery =
        !query || r.task.titulo.toLowerCase().includes(query.toLowerCase())
      return matchTab && matchQuery
    })
  }, [rows, tab, query])

  const grouped = useMemo(() => {
    const acc: Record<string, MyRow[]> = {}
    for (const r of list) {
      acc[r.boardName] ??= []
      acc[r.boardName].push(r)
    }
    return acc
  }, [list])

  const pendingCount = rows.filter((r) => !r.done).length

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Mis tareas</h1>
          <p className="mt-1 text-sm text-ink-500">
            {pendingCount} tareas pendientes en todos los tableros.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarea…"
            className="input w-64 pl-9"
          />
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-5 flex gap-1.5">
        {(
          [
            ['pendientes', `Pendientes (${pendingCount})`],
            ['todas', 'Todas'],
            ['completadas', 'Completadas'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === key
                ? 'bg-ink-900 text-ink-50'
                : 'bg-surface text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando tareas…
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
            <ListTodo className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">
            {tab === 'completadas' ? 'Aún no completas tareas' : 'Sin tareas'}
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Toma una tarjeta del tablero y asígnala a ti mismo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([boardName, tasks]) => {
            const b = tasks[0].boardColor
            return (
              <section key={boardName}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b }} />
                  <h2 className="text-sm font-bold text-ink-900">{boardName}</h2>
                  <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                    {tasks.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
                  {tasks.map((r, i) => (
                    <div
                      key={r.task.id}
                      className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50 ${
                        i > 0 ? 'border-t border-ink-100' : ''
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          r.done
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-ink-300 bg-surface'
                        }`}
                        aria-label="Estado"
                      >
                        {r.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            r.done ? 'text-ink-400 line-through' : 'text-ink-800'
                          }`}
                        >
                          {r.task.titulo}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                          <span
                            className="rounded px-1.5 py-0.5 font-semibold"
                            style={{
                              backgroundColor: `${r.boardColor}15`,
                              color: r.boardColor,
                            }}
                          >
                            {r.column}
                          </span>
                          <span
                            className="flex items-center gap-1 font-semibold"
                            style={{ color: priorityColor[r.task.prioridad] }}
                          >
                            <Flag className="h-3 w-3" />
                            {priorityLabel[r.task.prioridad]}
                          </span>
                          <span
                            className={
                              formatDue(r.task.fechaVencimiento) === 'Hoy'
                                ? 'font-bold text-rose-600'
                                : ''
                            }
                          >
                            Vence {formatDue(r.task.fechaVencimiento)}
                          </span>
                        </div>
                      </div>

                      <div className="hidden shrink-0 items-center gap-3 sm:flex">
                        <div className="flex -space-x-1.5">
                          {r.task.asignaciones.map((a) => (
                            <span
                              key={a.id}
                              title={`${a.nombre} ${a.apellidos}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-surface"
                              style={{ backgroundColor: a.avatarColor }}
                            >
                              {a.iniciales}
                            </span>
                          ))}
                        </div>
                        <Link
                          to={`/tableros/${r.boardId}`}
                          className="rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-600"
                          aria-label="Abrir en el tablero"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}