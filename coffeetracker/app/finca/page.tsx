import Topbar from '@/components/Topbar'
import FincaSearch from '@/components/FincaSearch'

export default function FincaPage() {
  return (
    <>
      <Topbar title="Farm View" subtitle="Farm to coffee shops that serve its coffee" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FincaSearch />
      </div>
    </>
  )
}
