import Topbar from '@/components/Topbar'
import FincaDetail from '@/components/FincaDetail'

interface Props {
  params: Promise<{ finca_id: string }>
}

export default async function FincaDetailPage({ params }: Props) {
  const { finca_id } = await params
  return (
    <>
      <Topbar title="Farm View" subtitle="Batches and coffee shops that serve them" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FincaDetail fincaId={finca_id} />
      </div>
    </>
  )
}
