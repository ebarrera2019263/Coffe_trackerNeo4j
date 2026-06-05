import Topbar from '@/components/Topbar'
import TrazabilidadDetail from '@/components/TrazabilidadDetail'

interface Props {
  params: Promise<{ lote_id: string }>
}

export default async function TrazabilidadLotePage({ params }: Props) {
  const { lote_id } = await params
  return (
    <>
      <Topbar title="Trazabilidad" subtitle="Cadena completa del lote" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TrazabilidadDetail loteId={lote_id} />
      </div>
    </>
  )
}
