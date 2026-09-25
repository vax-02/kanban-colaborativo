import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  LoaderCircle,
} from 'lucide-react'
import { getToken } from '../lib/api'
import { useBoardsStore } from '../store/boardsStore'
import type { Prioridad } from '../lib/types'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const PRIORITY_COLOR: Record<Prioridad, string> = {
  ALTA: '#ef4444',
  MEDIA: '#f59e0b',
  BAJA: '#64748b',
}

const PRIORITY_ORDER: Prioridad[] = ['ALTA', 'MEDIA', 'BAJA']

type CalTask = {
  id: string
  title: string
  boardName: string
  boardColor: string
  prioridad: Prioridad
  date: Date
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<CalTask[]>([])
  const loadBoards = useBoardsStore((s) => s.loadBoards)
  const getBoard = useBoardsStore((s) => s.getBoard)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

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

        const collected: CalTask[] = []
        for (const b of details) {
          for (const col of b.columnas) {
            for (const t of col.tareas) {
              if (!t.fechaVencimiento) continue
              const date = new Date(t.fechaVencimiento)
              if (Number.isNaN(date.getTime())) continue
              collected.push({
                id: t.id,
                title: t.titulo,
                boardName: b.nombre,
                boardColor: b.color,
                prioridad: t.prioridad,
                date,
              })
            }
          }
        }
        setTasks(collected)
      } catch {
        // sin conexión o error: el calendario queda vacío
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [getBoard, loadBoards])

  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = base.getFullYear()
  const month = base.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // lunes=0

  const monthName = base.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  const cells = useMemo(() => {
    const arr: (number | null)[] = Array.from({ length: firstDow }, () => null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [firstDow, daysInMonth])

  const tasksByDay = useMemo(() => {
    const map = new Map<number, CalTask[]>()
    for (const t of tasks) {
      if (t.date.getFullYear() !== year || t.date.getMonth() !== month) continue
      const arr = map.get(t.date.getDate()) ?? []
      arr.push(t)
      map.set(t.date.getDate(), arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.prioridad) - PRIORITY_ORDER.indexOf(b.prioridad) ||
          a.title.localeCompare(b.title),
      )
    }
    return map
  }, [tasks, year, month])

  const todayKey = toDateKey(today)

  const isToday = (day: number) =>
    `${year}-${month + 1}-${day}` === todayKey

  const dueToday = useMemo(
    () =>
      tasks
        .filter((t) => toDateKey(t.date) === todayKey && t.date >= today)
        .sort(
          (a, b) =>
            PRIORITY_ORDER.indexOf(a.prioridad) - PRIORITY_ORDER.indexOf(b.prioridad),
        ),
    [tasks, todayKey, today],
  )

  const soon = useMemo(
    () =>
      tasks
        .filter((t) => t.date >= today)
        .sort(
          (a, b) =>
            a.date.getTime() - b.date.getTime() ||
            PRIORITY_ORDER.indexOf(a.prioridad) - PRIORITY_ORDER.indexOf(b.prioridad),
        )
        .slice(0, 4),
    [tasks, today],
  )

  const tasksForDay = (day: number) => tasksByDay.get(day) ?? []

  return (
    <div className="flex h-full gap-4">
      {/* Calendario */}
      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthOffset((o) => o - 1)}
              className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonthOffset((o) => o + 1)}
              className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold tracking-tight text-ink-900 capitalize">
              {monthName}
            </h2>
            <span className="ml-2 hidden items-center gap-2 text-[11px] font-semibold text-ink-400 md:flex">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLOR.ALTA }} />
                Alta
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLOR.MEDIA }} />
                Media
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLOR.BAJA }} />
                Baja
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg bg-ink-100 px-3 py-2 text-xs font-semibold text-ink-600 md:block">
              Hoy: {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
            <button
              type="button"
              onClick={() => setMonthOffset(0)}
              className="btn-ghost px-3 py-2 text-xs"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-ink-100">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold tracking-wider text-ink-400 uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid flex-1 grid-cols-7 auto-rows-fr overflow-y-auto">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="border-ink-100 bg-ink-50/40" />
            const dayTasks = tasksForDay(day)
            const isLastRow = i >= cells.length - 7
            const dateLabel = new Date(year, month, day).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })
            return (
              <div
                key={i}
                className={`group relative min-h-24 border-ink-100 p-1.5 transition ${
                  i > 0 && i % 7 !== 0 ? 'border-l' : ''
                } ${i >= 7 ? 'border-t' : ''} hover:z-10 hover:bg-brand-50/50 ${
                  dayTasks.length > 0 ? 'cursor-pointer' : ''
                }`}
              >
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isToday(day)
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-600 group-hover:bg-brand-100 group-hover:text-brand-700'
                  }`}
                >
                  {day}
                </span>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-semibold text-white transition hover:brightness-110"
                      style={{ backgroundColor: PRIORITY_COLOR[t.prioridad] }}
                      title={`${t.title} · ${t.boardName} · Prioridad ${t.prioridad}`}
                    >
                      <Flag className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="px-1 text-[10px] font-semibold text-ink-500">
                      +{dayTasks.length - 3} más
                    </p>
                  )}
                </div>

                {dayTasks.length > 0 && (
                  <div
                    className={`pointer-events-none absolute right-1.5 left-1.5 z-20 rounded-xl border border-ink-200 bg-surface p-2.5 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
                      isLastRow ? 'bottom-8' : 'top-8'
                    }`}
                  >
                    <p className="mb-2 text-[11px] font-bold text-ink-900 capitalize">
                      {dateLabel}
                    </p>
                    <div className="max-h-36 space-y-1.5 overflow-y-auto">
                      {dayTasks.map((t) => (
                        <div key={t.id} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: PRIORITY_COLOR[t.prioridad] }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-ink-800">
                              {t.title}
                            </p>
                            <p className="truncate text-[10px] text-ink-400">{t.boardName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-white/70 text-sm font-medium text-ink-500 backdrop-blur-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
            Cargando tareas…
          </div>
        )}
      </section>

      {/* Panel lateral */}
      <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
        <section className="rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-ink-900">Próximos vencimientos</h3>
          {soon.length === 0 ? (
            <p className="text-xs text-ink-400">Sin tareas con fecha vencimiento.</p>
          ) : (
            <ul className="space-y-3">
              {soon.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: PRIORITY_COLOR[t.prioridad] }}
                  >
                    <Flag className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {t.title}
                    </p>
                    <p className="text-xs text-ink-400">
                      {t.boardName} · {t.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-300 py-2 text-xs font-semibold text-ink-400 transition hover:border-brand-300 hover:text-brand-600"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Añadir evento
          </button>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-ink-900">Vencen hoy</h3>
          {dueToday.length === 0 ? (
            <p className="text-xs text-ink-400">Nada vence hoy.</p>
          ) : (
            <ul className="space-y-2.5">
              {dueToday.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLOR[t.prioridad] }}
                  />
                  <span className="truncate text-sm text-ink-700">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white shadow-md">
          <p className="text-sm font-bold">Integración con Calendar</p>
          <p className="mt-1 text-xs text-brand-100">
            Sincroniza tus tareas con Google Calendar o Outlook.
          </p>
          <button
            type="button"
            className="mt-3 cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
          >
            Conectar calendario
          </button>
        </div>
      </aside>
    </div>
  )
}