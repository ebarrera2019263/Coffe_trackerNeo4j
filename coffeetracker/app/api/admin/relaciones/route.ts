import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

const REL_TYPES = ['AUDITA','CERTIFICA','COMPETENCIA_DE','COMPRO','CULTIVA','MEZCLADO_CON','PROCESO','PRODUJO','SIRVE','TOSTO','TRANSPORTO','VECINA_DE']
const LABELS = ['Cafeteria', 'Finca', 'Lote', 'Productor', 'Tostador', 'Beneficio', 'Transporte', 'Certificacion']

function getIdField(label: string): string {
  const map: Record<string, string> = {
    Cafeteria: 'cafeteria_id', Finca: 'finca_id', Lote: 'lote_id',
    Productor: 'productor_id', Tostador: 'tostador_id', Beneficio: 'beneficio_id',
    Transporte: 'transporte_id', Certificacion: 'cert_id',
  }
  return map[label] || 'id'
}

// Campos escalares de nombre/id comunes a todos los labels (sin arrays)
const SEARCH_FIELDS = ['nombre', 'cafeteria_id', 'finca_id', 'lote_id', 'codigo_lote',
  'productor_id', 'tostador_id', 'beneficio_id', 'transporte_id', 'cert_id', 'medio']

// LIST — relaciones de un tipo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'SIRVE'
    if (!REL_TYPES.includes(type)) return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })

    const search = searchParams.get('search') || null
    const fieldList = SEARCH_FIELDS.map(f => `'${f}'`).join(', ')
    const whereClause = search
      ? `WHERE any(k IN [${fieldList}] WHERE a[k] IS NOT NULL AND toLower(toString(a[k])) CONTAINS toLower($search))
            OR any(k IN [${fieldList}] WHERE b[k] IS NOT NULL AND toLower(toString(b[k])) CONTAINS toLower($search))`
      : ''
    const limit = search ? 500 : 200

    const records = await runQuery(
      `MATCH (a)-[r:${type}]->(b)
       ${whereClause}
       RETURN elementId(r)  AS eid,
              properties(r) AS props,
              labels(a)[0]  AS from_label, properties(a) AS from_node,
              labels(b)[0]  AS to_label,   properties(b) AS to_node
       ORDER BY eid DESC
       LIMIT ${limit}`,
      search ? { search } : {}
    )
    return NextResponse.json(records)
  } catch (error) {
    console.error('[GET /api/admin/relaciones]', error)
    return NextResponse.json({ error: 'Error al consultar relaciones' }, { status: 500 })
  }
}

// CREATE — relación con propiedades
export async function POST(request: Request) {
  try {
    const { type, from_label, from_id_value, to_label, to_id_value, properties } = await request.json() as {
      type: string
      from_label: string; from_id_value: string
      to_label: string;   to_id_value: string
      properties: Record<string, unknown>
    }

    if (!REL_TYPES.includes(type)) return NextResponse.json({ error: 'Tipo de relación no válido' }, { status: 400 })
    if (!LABELS.includes(from_label) || !LABELS.includes(to_label)) {
      return NextResponse.json({ error: 'Labels de nodos no válidas' }, { status: 400 })
    }

    const from_idf = getIdField(from_label)
    const to_idf   = getIdField(to_label)

    const records = await runQuery(
      `MATCH (a:${from_label}), (b:${to_label})
       WHERE a.${from_idf} = $from_id AND b.${to_idf} = $to_id
       CREATE (a)-[r:${type} $props]->(b)
       RETURN elementId(r) AS eid, properties(r) AS props`,
      { from_id: from_id_value, to_id: to_id_value, props: properties }
    )

    if (records.length === 0) {
      return NextResponse.json({ error: 'No se encontraron los nodos especificados' }, { status: 404 })
    }
    return NextResponse.json(records[0], { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/relaciones]', error)
    return NextResponse.json({ error: 'Error al crear relación' }, { status: 500 })
  }
}

// UPDATE — propiedades de 1 relación (null elimina la propiedad)
export async function PUT(request: Request) {
  try {
    const { element_id, properties } = await request.json() as {
      element_id: string; properties: Record<string, unknown>
    }
    const records = await runQuery(
      `MATCH ()-[r]->() WHERE elementId(r) = $eid SET r += $props
       RETURN elementId(r) AS eid, properties(r) AS props`,
      { eid: element_id, props: properties }
    )
    if (records.length === 0) return NextResponse.json({ error: 'Relación no encontrada' }, { status: 404 })
    return NextResponse.json(records[0])
  } catch (error) {
    console.error('[PUT /api/admin/relaciones]', error)
    return NextResponse.json({ error: 'Error al actualizar relación' }, { status: 500 })
  }
}

// BULK UPDATE — propiedades de múltiples relaciones (null elimina la propiedad)
export async function PATCH(request: Request) {
  try {
    const { element_ids, properties } = await request.json() as {
      element_ids: string[]; properties: Record<string, unknown>
    }
    if (!element_ids?.length) return NextResponse.json({ error: 'Se requieren element_ids' }, { status: 400 })
    const result = await runQuery(
      `MATCH ()-[r]->() WHERE elementId(r) IN $eids SET r += $props RETURN count(r) AS updated`,
      { eids: element_ids, props: properties }
    )
    return NextResponse.json({ updated: (result[0] as Record<string, unknown>).updated })
  } catch (error) {
    console.error('[PATCH /api/admin/relaciones]', error)
    return NextResponse.json({ error: 'Error al actualizar relaciones' }, { status: 500 })
  }
}

// DELETE — 1 relación o múltiples
export async function DELETE(request: Request) {
  try {
    const { element_id, element_ids } = await request.json() as {
      element_id?: string; element_ids?: string[]
    }
    const eids = (element_ids && element_ids.length > 0)
      ? element_ids
      : element_id ? [element_id] : []

    if (!eids.length) return NextResponse.json({ error: 'Se requiere element_id o element_ids' }, { status: 400 })

    await runQuery(
      `MATCH ()-[r]->() WHERE elementId(r) IN $eids DELETE r`,
      { eids }
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/relaciones]', error)
    return NextResponse.json({ error: 'Error al eliminar relación(es)' }, { status: 500 })
  }
}
