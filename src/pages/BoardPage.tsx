import { useEffect, useState } from 'react'
import { KanbanSquare, LoaderCircle, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import { useBoardsStore } from '../store/boardsStore'
import { useUiStore } from '../store/uiStore'
import { formatDue, formatUpdated, shortName } from '../lib/format'
import type { ColumnaDto, TaskDto, BoardDetailDto } from '../lib/types'
import type { Column, Label, Person, Task } from '../data/mock'

function toTask(t: TaskDto): Task {
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
    checklist: t.checklist.length
      ? { done: t.checklist.filter((c) => c.hecho).length, total: t.checklist.length }
      : undefined,
  }
}

function toColumn(c: ColumnaDto): Column {
  return { id: c.id, title: c.titulo, color: c.color, tasks: c.tareas.map(toTask) }
}

function BoardLoader({ boardId }: { boardId: string }) {
  const getBoard = useBoardsStore((s) => s.getBoard)
  const taskV = useBoardsStore((s) => s.taskV)
  const membersV = useBoardsStore((s) => s.membersV)
  const openModal = useUiStore((s) => s.openModal)
  const [board, setBoard] = useState<BoardDetailDto | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          <span className="text-ink-400">
            {board.columnas.length} columnas · {formatUpdated(board.updatedAt)}
          </span>
        </div>
      </div>

      <KanbanBoard
        initialColumns={board.columnas.map(toColumn)}
        onOpenTask={(taskId, columnId) =>
          openModal({ type: 'task', taskId, columnId, boardId: board.id })
        }
        onNewTask={(columnId) =>
          openModal({ type: 'task', taskId: '', columnId, boardId: board.id })
        }
      />
    </div>
  )
}

export default function BoardPage() {
  const { boardId } = useParams()
  if (!boardId) return null
  return <BoardLoader key={boardId} boardId={boardId} />
}