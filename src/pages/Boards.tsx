import { useEffect, useState } from 'react'
import {
  Check,
  KanbanSquare,
  LoaderCircle,
  Lock,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvatarStack } from '../components/Avatar'
import { useBoardsStore } from '../store/boardsStore'
import { useUiStore } from '../store/uiStore'
import { formatUpdated, isRecent, shortName } from '../lib/format'
import type { BoardDto } from '../lib/types'

type Tab = 'todos' | 'favoritos' | 'recientes'

export default function Boards() {
  const openModal = useUiStore((s) => s.openModal)
  const {
    boards,
    loading,
    loadBoards,
    deleteBoard,
    toggleFavorite,
    invites,
    loadInvitations,
    acceptInvitation,
    rejectInvitation,
  } = useBoardsStore()
  const [tab, setTab] = useState<Tab>('todos')
  const [query, setQuery] = useState('')

  useEffect(() => {
    void loadBoards()
  }, [loadBoards])

  useEffect(() => {
    void loadInvitations()
  }, [loadInvitations])

  const list = boards.filter((b) => {
    const matchQuery =
      !query ||
      b.nombre.toLowerCase().includes(query.toLowerCase()) ||
      (b.descripcion ?? '').toLowerCase().includes(query.toLowerCase())
    const matchTab =
      tab === 'todos' ||
      (tab === 'favoritos' && b.esFavorito) ||
      (tab === 'recientes' && (b.esFavorito || isRecent(b.updatedAt)))
    return matchQuery && matchTab
  })

  const onDelete = async (e: React.MouseEvent, b: BoardDto) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`¿Eliminar el tablero «${b.nombre}»? Esta acción no se puede deshacer.`)) {
      await deleteBoard(b.id)
    }
  }

  const onToggleFavorite = (e: React.MouseEvent, b: BoardDto) => {
    e.preventDefault()
    e.stopPropagation()
    void toggleFavorite(b.id)
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tableros</h1>
          <p className="mt-1 text-sm text-ink-500">
            {boards.length} tablero{boards.length !== 1 && 's'} · organiza cada proyecto de tu
            equipo aquí.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tablero…"
              className="input w-60 pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => openModal({ type: 'createBoard' })}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Crear tablero
          </button>
        </div>
      </div>

      {/* Invitaciones pendientes */}
      {invites.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <UserPlus className="h-4 w-4" />
            </span>
            Invitaciones pendientes ({invites.length})
          </p>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200/70 bg-white/70 p-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: inv.tablero.color }}
                >
                  {shortName(inv.tablero.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {inv.creadoPor.nombre} te invitó a «{inv.tablero.nombre}»
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    Rol: {inv.rol === 'ADMINISTRADOR' ? 'Administrador' : inv.rol === 'EDITOR' ? 'Editor' : inv.rol === 'LECTURA' ? 'Solo lectura' : 'Miembro'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void acceptInvitation(inv.id)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => void rejectInvitation(inv.id)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:bg-ink-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-5 flex gap-1.5">
        {(
          [
            ['todos', 'Todos'],
            ['favoritos', 'Favoritos'],
            ['recientes', 'Recientes'],
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
            {key === 'favoritos' && (
              <Star className="ml-1.5 inline h-3.5 w-3.5 text-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Carga */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-surface py-20 text-sm text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando tableros…
        </div>
      ) : boards.length === 0 ? (
        /* Estado vacío */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-surface py-20 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
            <KanbanSquare className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">No hay tableros</p>
          <p className="mt-1 text-sm text-ink-400">
            Crea un tablero nuevo para empezar a organizarte.
          </p>
          <button
            type="button"
            onClick={() => openModal({ type: 'createBoard' })}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            Crear tablero
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <p className="font-semibold text-ink-800">Sin resultados</p>
          <p className="mt-1 text-sm text-ink-400">
            Ningún tablero coincide con la búsqueda o el filtro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((b) => (
            <Link
              key={b.id}
              to={`/tableros/${b.id}`}
              className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
            >
              {/* Portada */}
              <div className="relative h-28 p-4" style={{ backgroundColor: `${b.color}25` }}>
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: b.color }}
                  >
                    {shortName(b.nombre)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(e, b)}
                      aria-label={b.esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      className={`cursor-pointer rounded-md p-1 transition hover:scale-110 ${
                        b.esFavorito ? 'bg-white/70' : 'bg-white/30 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          b.esFavorito ? 'fill-amber-400 text-amber-400' : 'text-ink-600'
                        }`}
                      />
                    </button>
                    {b.esPrivado && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80">
                        <Lock className="h-3.5 w-3.5 text-ink-500" />
                      </span>
                    )}
                  </div>
                </div>
                {/* barra de progreso decorativa */}
                <div className="absolute right-4 bottom-3 left-4 flex items-end gap-1">
                  {[30, 55, 40, 70, 45, 85, 60].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-t"
                      style={{ height: `${h * 0.28}px`, backgroundColor: b.color }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  {b.nombre}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">
                  {b.descripcion || 'Sin descripción'}
                </p>

                {/* Acciones */}
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openModal({ type: 'editBoard', boardId: b.id })
                    }}
                    className="cursor-pointer rounded-md p-1.5 text-ink-400 opacity-0 transition hover:bg-ink-100 hover:text-brand-600 group-hover:opacity-100"
                    aria-label="Editar tablero"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onDelete(e, b)}
                    className="cursor-pointer rounded-md p-1.5 text-ink-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                    aria-label="Eliminar tablero"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <AvatarStack
                    people={b.miembros.map((m) => ({
                      id: m.id,
                      name: `${m.nombre} ${m.apellidos}`,
                      initials: m.iniciales,
                      color: m.avatarColor,
                    }))}
                    max={3}
                  />
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-ink-700">
                      {b.done}/{b.tareas}
                    </p>
                    <p className="text-[11px] text-ink-400">{formatUpdated(b.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}