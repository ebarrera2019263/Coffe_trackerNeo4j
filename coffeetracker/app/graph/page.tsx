import Topbar from '@/components/Topbar'
import GraphView from '@/components/GraphView'

export default function GraphPage() {
  return (
    <>
      <Topbar title="Graph Explorer" subtitle="The entire supply chain as a living graph" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <GraphView />
      </div>
    </>
  )
}
