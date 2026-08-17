import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET() {
  try {
    const [nodes, links] = await Promise.all([
      runQuery<{ id: string; label: string; name: string; codigo: string | null }>(
        `MATCH (n)
         RETURN elementId(n) AS id,
                labels(n)[0] AS label,
                coalesce(n.nombre, n.codigo_lote, toString(n.tipo), '') AS name,
                n.codigo_lote AS codigo`
      ),
      runQuery<{ source: string; target: string; type: string }>(
        `MATCH (n)-[r]->(m)
         RETURN elementId(n) AS source, elementId(m) AS target, type(r) AS type`
      ),
    ])

    return NextResponse.json({ nodes, links })
  } catch (error) {
    console.error('[GET /api/graph]', error)
    return NextResponse.json({ error: 'Error loading graph' }, { status: 500 })
  }
}
