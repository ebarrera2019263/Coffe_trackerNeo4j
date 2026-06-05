import Topbar from '@/components/Topbar'
import TrazabilidadSearch from '@/components/TrazabilidadSearch'

export default function TrazabilidadPage() {
  return (
    <>
      <Topbar title="Trazabilidad" subtitle="El viaje de finca a taza" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TrazabilidadSearch />
      </div>
    </>
  )
}
