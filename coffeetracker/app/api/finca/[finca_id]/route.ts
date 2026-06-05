import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ finca_id: string }> }
) {
  try {
    const { finca_id } = await params

    const records = await runQuery(
      `MATCH (f:Finca {finca_id: $finca_id})-[:PRODUJO]->(l:Lote)<-[:SIRVE]-(c:Cafeteria)
       RETURN f, l, collect(distinct c) AS cafeterias
       ORDER BY l.fecha_cosecha DESC`,
      { finca_id }
    )

    if (records.length === 0) {
      return NextResponse.json({ error: 'Finca no encontrada' }, { status: 404 })
    }

    return NextResponse.json(records)
  } catch (error) {
    console.error('[GET /api/finca]', error)
    return NextResponse.json({ error: 'Error al consultar finca' }, { status: 500 })
  }
}
