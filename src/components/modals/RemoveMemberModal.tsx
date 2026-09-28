import { useState } from 'react'
import { AlertTriangle, LoaderCircle, UserMinus, UserPlus } from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { useBoardsStore } from '../../store/boardsStore'
import type { MemberDto, RolTablero } from '../../lib/types'

type Props = {
  boardId: string
  boardNombre: string
  member: MemberDto
  onClose: () => void
  onRemoved?: () => void
}

const ROL_LABEL: Record<RolTablero, string> = {
  ADMINISTRADOR: 'Administrador',
  EDITOR: 'Editor',
  MIEMBRO: 'Miembro',
  LECTURA: 'Solo lectura',
}

export default function RemoveMemberModal({
  boardId,
  boardNombre,
  member,
  onClose,
  onRemoved,
}: Props) {
  const removeMember = useBoardsStore((s) => s.removeMember)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quitar = async () => {
    setError(null)
    setRemoving(true)
    try {
      await removeMember(boardId, member.id)
      onRemoved?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar al miembro')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Modal
      title="Quitar del tablero"
      subtitle={`«${boardNombre}» · ${member.nombre} ${member.apellidos}`}
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <UserMinus className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          {error && <p className="mr-auto text-xs font-medium text-rose-500">{error}</p>}
          <button type="button" onClick={onClose} disabled={removing} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void quitar()}
            disabled={removing}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <UserMinus className="h-4 w-4" />
            )}
            {removing ? 'Quitando…' : 'Quitar del tablero'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3.5 rounded-xl border border-ink-200 bg-surface p-3.5">
        <Avatar
          initials={member.iniciales}
          color={member.avatarColor}
          name={`${member.nombre} ${member.apellidos}`}
          online={member.online}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-800">
            {member.nombre} {member.apellidos}
          </p>
          <p className="truncate text-xs text-ink-400">{member.email}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600">
          {ROL_LABEL[member.rol]}
        </span>
      </div>

      <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-amber-800">
          Perderá el acceso a <strong>«{boardNombre}»</strong> de inmediato. Sus tarjetas seguirán
          asignadas a su nombre y su participación quedará en el historial de miembros.
        </p>
      </div>

      <p className="mt-3.5 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
        Para volver a colaborar tendrá que aceptar una nueva invitación con el rol que elijas.
      </p>
    </Modal>
  )
}
