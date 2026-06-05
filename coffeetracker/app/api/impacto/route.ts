import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const finca_id = searchParams.get('finca_id')

    if (!finca_id) {
      return NextResponse.json({ error: 'finca_id es requerido' }, { status: 400 })
    }

    const records = await runQuery(
      `MATCH (f:Finca {finca_id: $finca_id})-[:VECINA_DE {comparte_microclima: true}]-(vecina:Finca)
       MATCH (vecina)-[:PRODUJO]->(l:Lote)<-[:SIRVE]-(c:Cafeteria)
       RETURN vecina.nombre AS finca_vecina,
              collect(distinct c.nombre) AS cafeterias_afectadas,
              count(l) AS lotes
       ORDER BY lotes DESC`,
      { finca_id }
    )

    return NextResponse.json(records)
  } catch (error) {
    console.error('[GET /api/impacto]', error)
    return NextResponse.json({ error: 'Error al consultar impacto' }, { status: 500 })
  }
}
