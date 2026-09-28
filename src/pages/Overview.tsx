import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  KanbanSquare,
  ListTodo,
  LoaderCircle,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar, { AvatarStack } from '../components/Avatar'
import { useBoardsStore } from '../store/boardsStore'
import { useAuthStore } from '../store/authStore'
import { formatDue, formatUpdated, shortName } from '../lib/format'
import type { BoardDetailDto, MemberDto } from '../lib/types'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  MIEMBRO: 'Miembro',
  EDITOR: 'Editor',
  LECTURA: 'Solo lectura',
}

const WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function sameDay(iso: string, d: Date) {
  const x = new Date(iso)
  return (
    x.getFullYear() === d.getFullYear() &&
    x.getMonth() === d.getMonth() &&
    x.getDate() === d.getDate()
  )
}

type FlatTask = {
  id: string
  titulo: string
  boardNombre: string
  boardColor: string
  column: string
  fechaVencimiento: string | null
  createdAt: string
  terminada: boolean
}

export default function Overview() {
  const boards = useBoardsStore((s) => s.boards)
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<BoardDetailDto[]>([])

  useEffect(() => {
    let active = true
    const run = async () => {
      const store = useBoardsStore.getState()
      if (store.boards.length === 0) await store.loadBoards()
      const list = useBoardsStore.getState().boards
      const loaded = await Promise.all(list.map((b) => store.getBoard(b.id)))
      if (active) {
        setDetails(loaded)
        setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [])

  const allTasks = useMemo<FlatTask[]>(() => {
    const out: FlatTask[] = []
    for (const d of details) {
      for (const c of d.columnas) {
        for (const t of c.tareas) {
          const terminada = c.esFinalizada
          out.push({
            id: t.id,
            titulo: t.titulo,
            boardNombre: d.nombre,
            boardColor: d.color,
            column: c.titulo,
            fechaVencimiento: t.fechaVencimiento,
            createdAt: t.createdAt,
            terminada,
          })
        }
      }
    }
    return out
  }, [details])

  const miembros = useMemo<MemberDto[]>(() => {
    const map = new Map<string, MemberDto>()
    for (const b of boards) {
      for (const m of b.miembros) if (!map.has(m.id)) map.set(m.id, m)
    }
    return [...map.values()]
  }, [boards])

  const today = new Date()
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' })
  const dateLabel = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  const tareasEnCurso = allTasks.filter((t) => !t.terminada).length
  const completadas = allTasks.filter((t) => t.terminada).length
  const pendientesHoy = allTasks.filter(
    (t) => !t.terminada && t.fechaVencimiento && sameDay(t.fechaVencimiento, today),
  ).length
  const online = miembros.filter((m) => m.online).length

  const stats = [
    {
      label: 'Tableros activos',
      value: String(boards.length),
      delta: `${boards.filter((b) => b.esFavorito).length} favoritos`,
      icon: KanbanSquare,
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      label: 'Tareas en curso',
      value: String(tareasEnCurso),
      delta: `${pendientesHoy} vencen hoy`,
      icon: CircleDot,
      color: '#f59e0b',
      bg: '#fef3c7',
    },
    {
      label: 'Completadas',
      value: String(completadas),
      delta:
        allTasks.length > 0
          ? `${Math.round((completadas / allTasks.length) * 100)}% del total`
          : 'Aún sin tareas',
      icon: CheckCircle2,
      color: '#10b981',
      bg: '#d1fae5',
    },
    {
      label: 'Miembros del equipo',
      value: String(miembros.length),
      delta: `${online} en línea`,
      icon: Users,
      color: '#8b5cf6',
      bg: '#ede9fe',
    },
  ]

  const deadlines = useMemo(
    () =>
      allTasks
        .filter((t) => !t.terminada && t.fechaVencimiento)
        .sort((a, b) => +new Date(a.fechaVencimiento!) - +new Date(b.fechaVencimiento!))
        .slice(0, 5),
    [allTasks],
  )

  const week = useMemo(() => {
    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return WEEK.map((_l, i) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const creadas = allTasks.filter((t) => sameDay(t.createdAt, day)).length
      const vencen = allTasks.filter(
        (t) => t.fechaVencimiento && sameDay(t.fechaVencimiento, day),
      ).length
      return { creadas, vencen }
    })
  }, [allTasks])

  const weekMax = Math.max(1, ...week.flatMap((w) => [w.creadas, w.vencen]))
  const creadasSemana = week.reduce((acc, w) => acc + w.creadas, 0)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
        Cargando panel…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 capitalize">
            {dayName}, {dateLabel}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {user?.nombre ? `Buen día, ${user.nombre}.` : 'Buen día.'}{' '}
            {pendientesHoy > 0
              ? `Tienes ${pendientesHoy} tarea${pendientesHoy === 1 ? '' : 's'} pendiente${pendientesHoy === 1 ? '' : 's'} para hoy.`
              : 'No tienes tareas que venzan hoy.'}
          </p>
        </div>
        <Link to="/tableros" className="btn-soft shrink-0">
          <KanbanSquare className="h-4 w-4" />
          Ver todos los tableros
        </Link>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-xs font-medium text-ink-500">{s.label}</p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">{s.delta}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {/* Actividad semanal */}
        <section className="col-span-3 rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Actividad de la semana</h2>
              <p className="text-xs text-ink-400">Tarjetas por día (actual)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Creadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink-200" /> Vencen
              </span>
            </div>
          </div>
          <div className="flex h-36 items-end gap-3">
            {week.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-28 w-full items-end justify-center gap-1.5">
                  <div
                    className="w-3.5 rounded-t-md bg-brand-500"
                    style={{ height: `${Math.max(w.creadas ? 12 : 4, (w.creadas / weekMax) * 100)}%` }}
                    title={`${w.creadas} creadas`}
                  />
                  <div
                    className="w-3.5 rounded-t-md bg-ink-200"
                    style={{ height: `${Math.max(w.vencen ? 12 : 4, (w.vencen / weekMax) * 100)}%` }}
                    title={`${w.vencen} vencen`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-ink-400">{WEEK[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {creadasSemana > 0
              ? `${creadasSemana} tarjetas creadas esta semana en tus tableros`
              : 'Aún no hay tarjetas creadas esta semana'}
          </div>
        </section>

        {/* Vencimientos */}
        <section className="col-span-3 rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Próximos vencimientos</h2>
            <Link
              to="/mis-tareas"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Ver todo
            </Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-400">
              Sin vencimientos próximos.
            </p>
          ) : (
            <ul className="space-y-3">
              {deadlines.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span
                    className="flex h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.boardColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{t.titulo}</p>
                    <p className="text-[11px] text-ink-400">
                      {t.boardNombre} · {t.column}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-bold ${
                      formatDue(t.fechaVencimiento) === 'Hoy'
                        ? 'text-rose-600'
                        : 'text-ink-500'
                    }`}
                  >
                    {formatDue(t.fechaVencimiento)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/mis-tareas"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-300 py-2 text-xs font-semibold text-ink-400 transition hover:border-brand-300 hover:text-brand-600"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Gestionar mis tareas
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Tableros recientes */}
        <section className="col-span-3 rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Tus tableros</h2>
            <Link
              to="/tableros"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Explorar todo
            </Link>
          </div>
          {boards.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-500">Aún no tienes tableros.</p>
              <Link to="/tableros" className="btn-primary mt-4">
                Crear mi primer tablero
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {boards.slice(0, 3).map((b) => (
                <Link
                  key={b.id}
                  to={`/tableros/${b.id}`}
                  className="group rounded-2xl border border-ink-200 p-3.5 transition hover:border-brand-200 hover:shadow-md"
                >
                  <div
                    className="mb-3 flex h-16 items-end justify-between rounded-xl p-2.5"
                    style={{ backgroundColor: `${b.color}20` }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: b.color }}
                    >
                      {shortName(b.nombre)}
                    </span>
                    <span
                      className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: b.color }}
                    >
                      {b.done}/{b.tareas}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                    {b.nombre}
                    {b.esFavorito && <span className="text-amber-400">★</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">
                    {b.descripcion || 'Sin descripción'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <AvatarStack
                      people={b.miembros.map((m) => ({
                        id: m.id,
                        name: `${m.nombre} ${m.apellidos}`,
                        initials: m.iniciales,
                        color: m.avatarColor,
                      }))}
                      max={3}
                    />
                    <span className="text-[11px] text-ink-400">
                      {formatUpdated(b.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Equipo en línea */}
        <section className="col-span-3 rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Equipo</h2>
            <Link
              to="/miembros"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Gestionar
            </Link>
          </div>
          {miembros.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-400">
              Sin miembros en tus tableros.
            </p>
          ) : (
            <ul className="space-y-3">
              {miembros.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar
                    initials={m.iniciales}
                    color={m.avatarColor}
                    name={`${m.nombre} ${m.apellidos}`}
                    online={m.online}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {m.nombre} {m.apellidos}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {ROL_LABEL[m.rol] ?? m.rol}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.online ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {m.online ? 'En línea' : 'Ausente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}