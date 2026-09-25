import { useUiStore } from '../store/uiStore'
import { team } from '../data/mock'
import CollaboratorModal from './CollaboratorModal'
import CreateBoardModal from './modals/CreateBoardModal'
import EditBoardModal from './modals/EditBoardModal'
import BoardMembersModal from './modals/BoardMembersModal'
import TaskModal from './modals/TaskModal'
import FiltersModal from './modals/FiltersModal'
import ActivityModal from './modals/ActivityModal'

export default function ModalGateway() {
  const { modal, closeModal } = useUiStore()

  if (!modal) return null

  switch (modal.type) {
    case 'collaborators':
      return <CollaboratorModal team={team} onClose={closeModal} />

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

    default:
      return null
  }
}