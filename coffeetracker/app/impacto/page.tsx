import Topbar from '@/components/Topbar'
import ImpactoView from '@/components/ImpactoView'

export default function ImpactoPage() {
  return (
    <>
      <Topbar title="Análisis de Impacto" subtitle="Cafeterías afectadas por fincas vecinas" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ImpactoView />
      </div>
    </>
  )
}
