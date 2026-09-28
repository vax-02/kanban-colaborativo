import { useState } from 'react'
import { AlertTriangle, LoaderCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../Modal'
import { useBoardsStore } from '../../store/boardsStore'

type Props = {
  boardId: string
  onClose: () => void
}

export default function DeleteBoardModal({ boardId, onClose }: Props) {
  const navigate = useNavigate()
  const deleteBoard = useBoardsStore((s) => s.deleteBoard)
  const board = useBoardsStore((s) => s.boards.find((b) => b.id === boardId))
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eliminar = async () => {
    setError(null)
    setDeleting(true)
    try {
      await deleteBoard(boardId)
      onClose()
      navigate('/tableros')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el tablero')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="Eliminar tablero"
      subtitle={
        board
          ? `«${board.nombre}» se eliminará de forma permanente.`
          : 'Este tablero se eliminará de forma permanente.'
      }
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          {error && <p className="mr-auto text-xs font-medium text-rose-500">{error}</p>}
          <button type="button" onClick={onClose} disabled={deleting} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void eliminar()}
            disabled={deleting}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? 'Eliminando…' : 'Eliminar tablero'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-amber-800">
          Se borrarán <strong>todas las columnas, tarjetas, etiquetas, comentarios y colaboradores</strong>{' '}
          asociados a este tablero. Esta acción no se puede deshacer.
        </p>
      </div>
    </Modal>
  )
}