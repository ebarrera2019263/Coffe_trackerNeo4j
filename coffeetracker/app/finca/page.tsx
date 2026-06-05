import Topbar from '@/components/Topbar'
import FincaSearch from '@/components/FincaSearch'

export default function FincaPage() {
  return (
    <>
      <Topbar title="Vista Finca" subtitle="Finca a cafeterías que sirven su café" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FincaSearch />
      </div>
    </>
  )
}
