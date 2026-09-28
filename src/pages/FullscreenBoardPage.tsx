import BoardPage from './BoardPage'
import ModalGateway from '../components/ModalGateway'

export default function FullscreenBoardPage() {
  return (
    <div className="h-screen overflow-hidden bg-ink-50 px-8 py-6">
      <BoardPage />
      <ModalGateway />
    </div>
  )
}