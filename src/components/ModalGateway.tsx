import { useUiStore } from '../store/uiStore'
import CollaboratorModal from './CollaboratorModal'
import CreateBoardModal from './modals/CreateBoardModal'
import EditBoardModal from './modals/EditBoardModal'
import BoardMembersModal from './modals/BoardMembersModal'
import TaskModal from './modals/TaskModal'
import FiltersModal from './modals/FiltersModal'
import ActivityModal from './modals/ActivityModal'
import DeleteBoardModal from './modals/DeleteBoardModal'
import RemoveMemberModal from './modals/RemoveMemberModal'
import ArchiveBoardModal from './modals/ArchiveBoardModal'
import LabelsModal from './modals/LabelsModal'

export default function ModalGateway() {
  const { modal, closeModal } = useUiStore()

  if (!modal) return null

  switch (modal.type) {
    case 'collaborators':
      return <CollaboratorModal boardId={modal.boardId} onClose={closeModal} />

    case 'createBoard':
      return <CreateBoardModal onClose={closeModal} />

    case 'editBoard':
      return <EditBoardModal boardId={modal.boardId} onClose={closeModal} />

    case 'boardMembers':
      return <BoardMembersModal boardId={modal.boardId} onClose={closeModal} />

    case 'task':
      return (
        <TaskModal
          boardId={modal.boardId}
          columnId={modal.columnId}
          taskId={modal.taskId || undefined}
          onClose={closeModal}
        />
      )

    case 'filters':
      return <FiltersModal onClose={closeModal} />

    case 'activity':
      return <ActivityModal onClose={closeModal} />

    case 'labels':
      return <LabelsModal boardId={modal.boardId} onClose={closeModal} />

    case 'deleteBoard':
      return <DeleteBoardModal boardId={modal.boardId} onClose={closeModal} />

    case 'archiveBoard':
      return (
        <ArchiveBoardModal
          boardId={modal.boardId}
          boardNombre={modal.boardNombre}
          boardColor={modal.boardColor}
          onClose={closeModal}
        />
      )

    case 'removeMember':
      return (
        <RemoveMemberModal
          boardId={modal.boardId}
          boardNombre={modal.boardNombre}
          member={modal.member}
          onClose={closeModal}
        />
      )

    default:
      return null
  }
}