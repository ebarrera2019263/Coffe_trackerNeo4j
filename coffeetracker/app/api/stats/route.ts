import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET() {
  try {
    const [row] = await runQuery<{
      cafeterias: number
      fincas: number
      lotes: number
      avg_sca: number | null
    }>(
      `MATCH (c:Cafeteria) WITH count(c) AS cafeterias
       MATCH (f:Finca)     WITH cafeterias, count(f) AS fincas
       MATCH (l:Lote)      WITH cafeterias, fincas, count(l) AS lotes, avg(l.puntaje_sca) AS avg_sca
       RETURN cafeterias, fincas, lotes, avg_sca`
    )
    return NextResponse.json({
      cafeterias: row?.cafeterias ?? 0,
      fincas:     row?.fincas     ?? 0,
      lotes:      row?.lotes      ?? 0,
      avg_sca:    row?.avg_sca != null ? Math.round(row.avg_sca * 10) / 10 : null,
    })
  } catch (error) {
    console.error('[GET /api/stats]', error)
    return NextResponse.json({ cafeterias: 0, fincas: 0, lotes: 0, avg_sca: null })
  }
}
