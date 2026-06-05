import Topbar from '@/components/Topbar'
import FincaDetail from '@/components/FincaDetail'

interface Props {
  params: Promise<{ finca_id: string }>
}

export default async function FincaDetailPage({ params }: Props) {
  const { finca_id } = await params
  return (
    <>
      <Topbar title="Vista Finca" subtitle="Lotes y cafeterías que los sirven" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FincaDetail fincaId={finca_id} />
      </div>
    </>
  )
}
