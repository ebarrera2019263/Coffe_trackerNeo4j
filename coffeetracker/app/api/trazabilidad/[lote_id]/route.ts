import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lote_id: string }> }
) {
  try {
    const { lote_id } = await params

    const records = await runQuery(
      `MATCH (cafe:Cafeteria)-[:SIRVE]->(l:Lote)
       WHERE l.lote_id = $lote_id OR l.codigo_lote = $lote_id
       MATCH (t:Tostador)-[:TOSTO]->(l)
       MATCH (b:Beneficio)-[:PROCESO]->(l)
       MATCH (f:Finca)-[:PRODUJO]->(l)
       MATCH (p:Productor)-[:CULTIVA]->(f)
       OPTIONAL MATCH (tr:Transporte)-[:TRANSPORTO]->(l)
       OPTIONAL MATCH (cert:Certificacion)-[:CERTIFICA]->(f)
       RETURN cafe,
              l  AS lote,
              t  AS tostador,
              b  AS beneficio,
              f  AS finca,
              p  AS productor,
              collect(distinct tr)   AS transportes,
              collect(distinct cert) AS certificaciones`,
      { lote_id }
    )

    if (records.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    return NextResponse.json(records[0])
  } catch (error) {
    console.error('[GET /api/trazabilidad]', error)
    return NextResponse.json({ error: 'Error al consultar trazabilidad' }, { status: 500 })
  }
}
