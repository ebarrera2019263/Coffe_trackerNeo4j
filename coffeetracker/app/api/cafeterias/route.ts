import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ciudad = searchParams.get('ciudad') || null
    const tipo = searchParams.get('tipo') || null

    const records = await runQuery<{ c: Record<string, unknown> }>(
      `MATCH (c:Cafeteria)
       WHERE ($ciudad IS NULL OR c.ciudad = $ciudad)
         AND ($tipo   IS NULL OR c.tipo   = $tipo)
       RETURN c
       ORDER BY c.nombre`,
      { ciudad, tipo }
    )

    const cafeterias = records.map((r) => r.c)
    return NextResponse.json(cafeterias)
  } catch (error) {
    console.error('[GET /api/cafeterias]', error)
    return NextResponse.json({ error: 'Error al consultar cafeterías' }, { status: 500 })
  }
}
