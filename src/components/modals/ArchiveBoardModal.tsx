import { useState } from 'react'
import { Archive, ArchiveRestore, LoaderCircle } from 'lucide-react'
import Modal from '../Modal'
import { useBoardsStore } from '../../store/boardsStore'

type Props = {
  boardId: string
  boardNombre: string
  boardColor: string
  onClose: () => void
}

export default function ArchiveBoardModal({
  boardId,
  boardNombre,
  boardColor,
  onClose,
}: Props) {
  const setArchivado = useBoardsStore((s) => s.setArchivado)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const archivar = async () => {
    setError(null)
    setArchiving(true)
    try {
      await setArchivado(boardId, true)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo archivar el tablero')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Modal
      title="Archivar tablero"
      subtitle="Deja de aparecer en tu lista activa sin perder nada"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Archive className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          {error && <p className="mr-auto text-xs font-medium text-rose-500">{error}</p>}
          <button type="button" onClick={onClose} disabled={archiving} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void archivar()}
            disabled={archiving}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archiving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {archiving ? 'Archivando…' : 'Archivar tablero'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3.5 rounded-xl border border-ink-200 bg-surface p-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: boardColor }}
        >
          {boardNombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-800">{boardNombre}</p>
          <p className="truncate text-xs text-ink-400">
            Se moverá a la pestaña Archivados
          </p>
        </div>
      </div>

      <ul className="mt-3.5 space-y-2 text-sm text-ink-600">
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <span>
            Los colaboradores dejarán de verlo en su lista, aunque puedan abrirlo con el
            enlace directo.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <span>
            Las tarjetas, comentarios, etiquetas e invitaciones se conservan intactos.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <ArchiveRestore className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
          <span>
            Podrás restaurarlo cuando quieras desde <strong>Tableros → Archivados</strong>.
          </span>
        </li>
      </ul>
    </Modal>
  )
}
