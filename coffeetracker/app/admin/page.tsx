import Topbar from '@/components/Topbar'
import AdminView from '@/components/AdminView'

export default function AdminPage() {
  return (
    <>
      <Topbar title="Administration" subtitle="Management of graph nodes and relationships" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AdminView />
      </div>
    </>
  )
}
