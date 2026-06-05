import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

export async function GET() {
  try {
    const records = await runQuery<{ label: string; total: number }>(
      `MATCH (n)
       RETURN labels(n)[0] AS label, count(n) AS total
       ORDER BY total DESC`
    )
    return NextResponse.json({ ok: true, nodos: records })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
