import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cafeteria_id: string }> }
) {
  try {
    const { cafeteria_id } = await params
    const records = await runQuery<{ l: Record<string, unknown>; finca_nombre: string | null }>(
      `MATCH (c:Cafeteria {cafeteria_id: $cafeteria_id})-[:SIRVE]->(l:Lote)
       OPTIONAL MATCH (l)<-[:PRODUJO]-(f:Finca)
       RETURN l, f.nombre AS finca_nombre
       ORDER BY l.codigo_lote`,
      { cafeteria_id }
    )
    return NextResponse.json(records.map((r) => ({ ...r.l, finca_nombre: r.finca_nombre ?? null })))
  } catch (error) {
    console.error('[GET /api/cafeterias/[cafeteria_id]/lotes]', error)
    return NextResponse.json({ error: 'Error al consultar lotes' }, { status: 500 })
  }
}
