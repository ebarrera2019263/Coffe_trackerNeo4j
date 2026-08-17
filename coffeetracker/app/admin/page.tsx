import Topbar from '@/components/Topbar'
import AdminView from '@/components/AdminView'
import SignOutButton from '@/components/SignOutButton'

export default function AdminPage() {
  return (
    <>
      <Topbar title="Administration" subtitle="Management of graph nodes and relationships">
        <SignOutButton />
      </Topbar>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AdminView />
      </div>
    </>
  )
}
