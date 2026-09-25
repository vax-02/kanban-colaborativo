import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ModalGateway from '../components/ModalGateway'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-hidden px-8 py-6">
          <Outlet />
        </main>
      </div>
      <ModalGateway />
    </div>
  )
}