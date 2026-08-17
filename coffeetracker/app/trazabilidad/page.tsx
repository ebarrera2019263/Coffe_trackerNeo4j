import Topbar from '@/components/Topbar'
import TrazabilidadSearch from '@/components/TrazabilidadSearch'

export default function TrazabilidadPage() {
  return (
    <>
      <Topbar title="Traceability" subtitle="The journey from farm to cup" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TrazabilidadSearch />
      </div>
    </>
  )
}
