import Topbar from '@/components/Topbar'
import ImpactoView from '@/components/ImpactoView'

export default function ImpactoPage() {
  return (
    <>
      <Topbar title="Impact Analysis" subtitle="Coffee shops affected by neighboring farms" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ImpactoView />
      </div>
    </>
  )
}
