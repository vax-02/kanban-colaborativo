import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  KanbanSquare,
  LoaderCircle,
  Plus,
  SlidersHorizontal,
  Tag,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import Modal from '../components/Modal'
import { useAuthStore } from '../store/authStore'
import { useBoardsStore } from '../store/boardsStore'
import { useFiltersStore } from '../store/filtersStore'
import { useUiStore } from '../store/uiStore'
import {
  countActiveFilters,
  filtersActive,
  isDoneColumn,
  taskMatchesFilters,
} from '../lib/filters'
import { formatDue, formatUpdated, shortName } from '../lib/format'
import type { ColumnaDto, TaskDto, BoardDetailDto } from '../lib/types'
import type { Column, Label, Person, Task } from '../data/mock'

function dueStateOf(
  iso: string | null,
  done: boolean,
): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!iso || done) return 'none'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - hoy.getTime()) / 86_400_000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'upcoming'
}

function toTask(t: TaskDto, done: boolean): Task {
  return {
    id: t.id,
    title: t.titulo,
    description: t.descripcion ?? undefined,
    labels: t.etiquetas.map((e): Label => ({ text: e.texto, color: e.color })),
    assignees: t.asignaciones.map((a): Person => ({
      id: a.id,
      name: `${a.nombre} ${a.apellidos}`,
      email: a.email,
      initials: a.iniciales,
      color: a.avatarColor,
      role: a.rol,
      online: a.online,
    })),
    due: formatDue(t.fechaVencimiento),
    dueState: dueStateOf(t.fechaVencimiento, done),
    checklist: t.checklist.length
      ? { done: t.checklist.filter((c) => c.hecho).length, total: t.checklist.length }
      : undefined,
  }
}

function toColumn(c: ColumnaDto): Column {
  return {
    id: c.id,
    title: c.titulo,
    color: c.color,
    isDone: c.esFinalizada,
    tasks: c.tareas.map((t) => toTask(t, c.esFinalizada)),
  }
}

const COLUMN_COLORS = [
  '#94a3b8',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
]

function BoardLoader({ boardId }: { boardId: string }) {
  const getBoard = useBoardsStore((s) => s.getBoard)
  const taskV = useBoardsStore((s) => s.taskV)
  const membersV = useBoardsStore((s) => s.membersV)
  const openModal = useUiStore((s) => s.openModal)
  const me = useAuthStore((s) => s.user)
  const updateTask = useBoardsStore((s) => s.updateTask)
  const bumpTask = useBoardsStore((s) => s.bumpTask)
  const createColumn = useBoardsStore((s) => s.createColumn)
  const updateColumn = useBoardsStore((s) => s.updateColumn)
  const deleteColumn = useBoardsStore((s) => s.deleteColumn)
  const reorderColumns = useBoardsStore((s) => s.reorderColumns)
  const setArchivado = useBoardsStore((s) => s.setArchivado)
  const filterState = useFiltersStore((s) => s.filters)
  const [params] = useSearchParams()
  const openedTask = useRef<string | null>(null)
  const [board, setBoard] = useState<BoardDetailDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [columnForm, setColumnForm] = useState({ open: false, titulo: '', color: '#94a3b8' })
  const [deleteCol, setDeleteCol] = useState<{
    id: string
    titulo: string
    tareas: number
    destino: string
  } | null>(null)
  const [savingColumn, setSavingColumn] = useState(false)
  const [columnError, setColumnError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getBoard(boardId)
      .then((b) => {
        if (active) setBoard(b)
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar el tablero')
      })
    return () => {
      active = false
    }
  }, [boardId, taskV, membersV, getBoard])

  const tareaParam = params.get('tarea')
  useEffect(() => {
    if (!tareaParam || !board || openedTask.current === tareaParam) return
    const col = board.columnas.find((c) => c.tareas.some((t) => t.id === tareaParam))
    if (!col) return
    openedTask.current = tareaParam
    openModal({ type: 'task', taskId: tareaParam, columnId: col.id, boardId: board.id })
  }, [tareaParam, board, openModal])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (useUiStore.getState().modal) return
      if (e.key === 'n' || e.key === 'N') {
        const first = board?.columnas[0]
        const viewerRol = board?.miembros.find((m) => m.id === me?.id)?.rol
        if (first && viewerRol && viewerRol !== 'LECTURA') {
          openModal({ type: 'task', taskId: '', columnId: first.id, boardId: board.id })
        }
      }
      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('topbar-search')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [board, me?.id, openModal])

  const visibleColumns = useMemo(() => {
    if (!board || filterState.boardId !== board.id) return board?.columnas ?? []
    return board.columnas
      .filter((c) => filterState.showDone || !isDoneColumn(c))
      .map((c) => ({
        ...c,
        tareas: c.tareas.filter((t) => taskMatchesFilters(t, filterState)),
      }))
  }, [board, filterState])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
          <KanbanSquare className="h-7 w-7" />
        </span>
        <p className="font-semibold text-ink-800">{error}</p>
        <p className="mt-1 text-sm text-ink-400">
          No tienes acceso a este tablero o no existe.
        </p>
        <Link to="/tableros" className="btn-primary mt-5">
          Volver a tableros
        </Link>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
        Cargando tablero…
      </div>
    )
  }

  const myMember = board.miembros.find((m) => m.id === me?.id)
  const canEdit = myMember ? myMember.rol !== 'LECTURA' : false

  const appliedFilters = filterState.boardId === board.id
  const filterCount = appliedFilters ? countActiveFilters(filterState) : 0
  const filtered = appliedFilters && filtersActive(filterState)

  const handleMoveTask = async (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ) => {
    const target = board.columnas.find((c) => c.id === toColumnId)
    if (!target) return
    const fullIds = target.tareas.map((t) => t.id)
    const visible = target.tareas
      .filter((t) => !filtered || taskMatchesFilters(t, filterState))
      .map((t) => t.id)

    let insertInFull: number
    if (visible.length === 0 || toIndex <= 0) {
      insertInFull = 0
    } else {
      const beforeId = visible[Math.min(toIndex, visible.length) - 1]
      insertInFull = fullIds.indexOf(beforeId) + 1
    }

    const without = fullIds.filter((id) => id !== taskId)
    const origIdx = fullIds.indexOf(taskId)
    let insertAt = insertInFull
    if (origIdx !== -1 && origIdx < insertAt) insertAt -= 1
    insertAt = Math.max(0, Math.min(insertAt, without.length))
    const next = [...without.slice(0, insertAt), taskId, ...without.slice(insertAt)]

    if (fromColumnId === toColumnId && fullIds.join(',') === next.join(',')) return
    try {
      await updateTask(taskId, { columnaId: toColumnId, orden: next })
    } catch {
      /* si el servidor rechaza, se recarga el tablero para volver al estado real */
    } finally {
      bumpTask()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-ink-500">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
          style={{ backgroundColor: board.color }}
        >
          {shortName(board.nombre)}
        </span>
        {board.nombre}
        <span className="text-ink-300">/</span>
        <span className="text-ink-700">Tablero Kanban</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {board.miembros.slice(0, 4).map((m) => (
              <span
                key={m.id}
                title={`${m.nombre} ${m.apellidos}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-surface"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.iniciales}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openModal({ type: 'boardMembers', boardId: board.id })}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-600"
          >
            <Users className="h-3.5 w-3.5" />
            {board.miembros.length} miembros
          </button>
          <button
            type="button"
            onClick={() => openModal({ type: 'labels', boardId: board.id })}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-600"
            title="Gestionar etiquetas del tablero"
          >
            <Tag className="h-3.5 w-3.5" />
            Etiquetas
          </button>
          {filtered && (
            <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {filterCount} {filterCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
          <span className="text-ink-400">
            {board.columnas.length} columnas · {formatUpdated(board.updatedAt)}
          </span>
        </div>
      </div>

      {board.archivado && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-100/70 px-4 py-3">
          <Archive className="h-5 w-5 shrink-0 text-ink-500" />
          <p className="min-w-0 flex-1 text-sm font-semibold text-ink-700">
            Este tablero está archivado y no aparece en el listado ni en el menú lateral.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await setArchivado(board.id, false)
                } catch {
                  /* si falla, se recarga el tablero para volver al estado real */
                }
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-ink-700"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              Restaurar
            </button>
          )}
        </div>
      )}

      <KanbanBoard
        initialColumns={visibleColumns.map(toColumn)}
        canEdit={canEdit}
        onMoveTask={handleMoveTask}
        onOpenTask={(taskId, columnId) =>
          openModal({ type: 'task', taskId, columnId, boardId: board.id })
        }
        onNewTask={(columnId) =>
          openModal({ type: 'task', taskId: '', columnId, boardId: board.id })
        }
        onNewColumn={() => {
          setColumnForm({ open: true, titulo: '', color: '#94a3b8' })
          setColumnError(null)
        }}
        onRenameColumn={async (columnaId, titulo) => {
          try {
            await updateColumn(board.id, columnaId, { titulo })
          } catch {
            bumpTask()
          }
        }}
        onToggleDoneColumn={async (columnaId, esFinalizada) => {
          try {
            await updateColumn(board.id, columnaId, { esFinalizada })
          } catch {
            bumpTask()
          }
        }}
        onDeleteColumn={(columnaId) => {
          const target = board.columnas.find((c) => c.id === columnaId)
          setDeleteCol({
            id: columnaId,
            titulo: target?.titulo ?? '',
            tareas: target?.tareas.length ?? 0,
            destino: '',
          })
          setColumnError(null)
        }}
        onReorderColumns={async (ids) => {
          try {
            await reorderColumns(board.id, ids)
          } catch {
            bumpTask()
          }
        }}
      />

      {columnForm.open && (
        <Modal
          title="Nueva columna"
          subtitle="Se añadirá al final del tablero."
          icon={<Plus className="h-5 w-5" />}
          onClose={() => setColumnForm((f) => ({ ...f, open: false }))}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setColumnForm((f) => ({ ...f, open: false }))}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!columnForm.titulo.trim() || savingColumn}
                onClick={async () => {
                  setSavingColumn(true)
                  setColumnError(null)
                  try {
                    await createColumn(
                      board.id,
                      columnForm.titulo.trim(),
                      columnForm.color,
                    )
                    setColumnForm({ open: false, titulo: '', color: '#94a3b8' })
                  } catch (e) {
                    setColumnError(
                      e instanceof Error ? e.message : 'No se pudo crear la columna',
                    )
                  } finally {
                    setSavingColumn(false)
                  }
                }}
                className="btn-primary"
              >
                {savingColumn ? 'Creando…' : 'Crear columna'}
              </button>
            </div>
          }
        >
          {columnError && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {columnError}
            </p>
          )}
          <label className="mb-1.5 block text-xs font-bold text-ink-600">
            Nombre de la columna
          </label>
          <input
            autoFocus
            value={columnForm.titulo}
            onChange={(e) =>
              setColumnForm((f) => ({ ...f, titulo: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !columnForm.titulo.trim()) return
              e.preventDefault()
              const run = async () => {
                setSavingColumn(true)
                setColumnError(null)
                try {
                  await createColumn(board.id, columnForm.titulo.trim(), columnForm.color)
                  setColumnForm({ open: false, titulo: '', color: '#94a3b8' })
                } catch (err) {
                  setColumnError(
                    err instanceof Error ? err.message : 'No se pudo crear la columna',
                  )
                } finally {
                  setSavingColumn(false)
                }
              }
              void run()
            }}
            maxLength={100}
            placeholder="Ej. En espera, Revisión legal…"
            className="input"
          />
          <p className="mt-4 mb-1.5 text-xs font-bold text-ink-600">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLUMN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColumnForm((f) => ({ ...f, color: c }))}
                aria-label={`Color ${c}`}
                className={`h-7 w-7 cursor-pointer rounded-full ring-offset-2 transition ${
                  columnForm.color === c
                    ? 'ring-2 ring-ink-800'
                    : 'ring-1 ring-ink-200 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Modal>
      )}

      {deleteCol && (
        <Modal
          title="Eliminar columna"
          subtitle={`«${deleteCol.titulo}» se quitará del tablero.`}
          icon={<Trash2 className="h-5 w-5" />}
          onClose={() => setDeleteCol(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteCol(null)} className="btn-ghost">
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  savingColumn ||
                  board.columnas.length <= 1 ||
                  (deleteCol.tareas > 0 && !deleteCol.destino)
                }
                onClick={async () => {
                  setSavingColumn(true)
                  setColumnError(null)
                  try {
                    await deleteColumn(
                      board.id,
                      deleteCol.id,
                      deleteCol.destino || undefined,
                    )
                    setDeleteCol(null)
                  } catch (e) {
                    setColumnError(
                      e instanceof Error ? e.message : 'No se pudo eliminar la columna',
                    )
                  } finally {
                    setSavingColumn(false)
                  }
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingColumn ? 'Eliminando…' : 'Eliminar columna'}
              </button>
            </div>
          }
        >
          {columnError && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {columnError}
            </p>
          )}
          {board.columnas.length <= 1 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              El tablero debe tener al menos una columna, así que no se puede eliminar.
            </p>
          ) : deleteCol.tareas > 0 ? (
            <>
              <p className="mb-2 text-xs font-semibold text-ink-600">
                Esta columna tiene {deleteCol.tareas}{' '}
                {deleteCol.tareas === 1 ? 'tarea' : 'tareas'}. Elige a dónde moverlas
                antes de eliminarla.
              </p>
              <select
                value={deleteCol.destino}
                onChange={(e) =>
                  setDeleteCol((d) => (d ? { ...d, destino: e.target.value } : d))
                }
                className="input cursor-pointer"
              >
                <option value="">Selecciona la columna destino…</option>
                {board.columnas
                  .filter((c) => c.id !== deleteCol.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo} ({c.tareas.length})
                    </option>
                  ))}
              </select>
            </>
          ) : (
            <p className="text-xs text-ink-500">
              La columna está vacía, se eliminará sin más consecuencias.
            </p>
          )}
        </Modal>
      )}
    </div>
  )
}

export default function BoardPage() {
  const { boardId } = useParams()
  if (!boardId) return null
  return <BoardLoader key={boardId} boardId={boardId} />
}