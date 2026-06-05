import Topbar from '@/components/Topbar'
import AdminView from '@/components/AdminView'

export default function AdminPage() {
  return (
    <>
      <Topbar title="Administración" subtitle="Gestión de nodos y relaciones del grafo" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AdminView />
      </div>
    </>
  )
}
