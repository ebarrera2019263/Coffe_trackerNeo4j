import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/neo4j'

const LABELS = ['Cafeteria', 'Finca', 'Lote', 'Productor', 'Tostador', 'Beneficio', 'Transporte', 'Certificacion']
const REL_TYPES = ['AUDITA','CERTIFICA','COMPETENCIA_DE','COMPRO','CULTIVA','MEZCLADO_CON','PROCESO','PRODUJO','SIRVE','TOSTO','TRANSPORTO','VECINA_DE']

function getIdField(label: string): string {
  const map: Record<string, string> = {
    Cafeteria: 'cafeteria_id', Finca: 'finca_id', Lote: 'lote_id',
    Productor: 'productor_id', Tostador: 'tostador_id', Beneficio: 'beneficio_id',
    Transporte: 'transporte_id', Certificacion: 'cert_id',
  }
  return map[label] || 'id'
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseScalar(v: string): unknown {
  if (v === '' || v === 'null') return null
  if (v === 'true') return true
  if (v === 'false') return false
  const n = Number(v)
  if (!isNaN(n) && v.trim() !== '') return n
  return v
}

function parseExtraProps(propsStr: string): Record<string, unknown> {
  if (!propsStr.trim()) return {}
  const props: Record<string, unknown> = {}
  for (const pair of propsStr.split('|')) {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) continue
    const key = pair.slice(0, eqIdx).trim()
    const val = pair.slice(eqIdx + 1).trim()
    if (!key) continue
    // Semicolon-separated values become arrays
    if (val.includes(';')) {
      props[key] = val.split(';').map(v => parseScalar(v))
    } else {
      props[key] = parseScalar(val)
    }
  }
  return props
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

    const text = await file.text()
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

    if (lines.length < 2) return NextResponse.json({ error: 'El CSV está vacío o solo tiene encabezado' }, { status: 400 })

    // Skip header row
    const dataLines = lines.slice(1)

    let nodesCreated = 0
    let relsCreated = 0
    const errors: string[] = []

    for (let i = 0; i < dataLines.length; i++) {
      const lineNum = i + 2
      const cols = parseCSVLine(dataLines[i])
      const [type, label, rel_type, from_label, from_id, to_label, to_id, extra_props] = cols

      if (!type) continue

      if (type === 'node') {
        if (!label || !LABELS.includes(label)) {
          errors.push(`Línea ${lineNum}: label inválido "${label}"`)
          continue
        }
        const props = parseExtraProps(extra_props || '')
        if (!Object.keys(props).length) {
          errors.push(`Línea ${lineNum}: nodo sin propiedades`)
          continue
        }
        try {
          await runQuery(`CREATE (n:${label} $props)`, { props })
          nodesCreated++
        } catch (e) {
          errors.push(`Línea ${lineNum}: error creando nodo ${label} — ${e instanceof Error ? e.message : e}`)
        }

      } else if (type === 'rel') {
        if (!rel_type || !REL_TYPES.includes(rel_type)) {
          errors.push(`Línea ${lineNum}: rel_type inválido "${rel_type}"`)
          continue
        }
        if (!from_label || !LABELS.includes(from_label)) {
          errors.push(`Línea ${lineNum}: from_label inválido "${from_label}"`)
          continue
        }
        if (!to_label || !LABELS.includes(to_label)) {
          errors.push(`Línea ${lineNum}: to_label inválido "${to_label}"`)
          continue
        }
        if (!from_id || !to_id) {
          errors.push(`Línea ${lineNum}: from_id o to_id vacío`)
          continue
        }
        const from_idf = getIdField(from_label)
        const to_idf = getIdField(to_label)
        const relProps = parseExtraProps(extra_props || '')
        try {
          const result = await runQuery(
            `MATCH (a:${from_label}), (b:${to_label})
             WHERE a.${from_idf} = $from_id AND b.${to_idf} = $to_id
             CREATE (a)-[r:${rel_type} $props]->(b)
             RETURN count(r) AS created`,
            { from_id, to_id, props: relProps }
          )
          const created = (result[0] as Record<string, unknown>)?.created
          if (!created) {
            errors.push(`Línea ${lineNum}: no se encontraron nodos ${from_label}(${from_id}) o ${to_label}(${to_id})`)
          } else {
            relsCreated++
          }
        } catch (e) {
          errors.push(`Línea ${lineNum}: error creando relación — ${e instanceof Error ? e.message : e}`)
        }

      } else {
        errors.push(`Línea ${lineNum}: tipo desconocido "${type}" (debe ser "node" o "rel")`)
      }
    }

    return NextResponse.json({ nodes_created: nodesCreated, rels_created: relsCreated, errors })
  } catch (error) {
    console.error('[POST /api/admin/csv]', error)
    return NextResponse.json({ error: 'Error procesando el CSV' }, { status: 500 })
  }
}

// LOAD CSV desde URL pública (GitHub raw, S3, etc.) — método nativo Neo4j
export async function PUT(request: Request) {
  try {
    const { url } = await request.json() as { url: string }
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Usa LOAD CSV nativo de Neo4j + MERGE para evitar duplicados
    const result = await runQuery<{ lotes: number; rels: number }>(
      `LOAD CSV WITH HEADERS FROM $url AS row
       MERGE (l:Lote {lote_id: row.lote_id})
       SET l.codigo_lote   = row.codigo_lote,
           l.proceso        = row.proceso,
           l.puntaje_sca    = toFloat(row.puntaje_sca),
           l.notas_cata     = split(row.notas_cata, ';'),
           l.fecha_cosecha  = row.fecha_cosecha,
           l.peso_kg        = toFloat(row.peso_kg)
       WITH l, row
       OPTIONAL MATCH (c:Cafeteria  {cafeteria_id:  row.cafeteria_id})
       OPTIONAL MATCH (f:Finca      {finca_id:      row.finca_id})
       OPTIONAL MATCH (t:Tostador   {tostador_id:   row.tostador_id})
       OPTIONAL MATCH (b:Beneficio  {beneficio_id:  row.beneficio_id})
       FOREACH (_ IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END | MERGE (c)-[:SIRVE]->(l))
       FOREACH (_ IN CASE WHEN f IS NOT NULL THEN [1] ELSE [] END | MERGE (f)-[:PRODUJO]->(l))
       FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:TOSTO]->(l))
       FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END | MERGE (b)-[:PROCESO]->(l))
       RETURN count(l) AS lotes`,
      { url }
    )

    const lotes = Number((result[0] as Record<string, unknown>)?.lotes ?? 0)
    return NextResponse.json({ lotes_importados: lotes, message: `${lotes} lote(s) importado(s) vía LOAD CSV` })
  } catch (error) {
    console.error('[PUT /api/admin/csv]', error)
    const msg = error instanceof Error ? error.message : 'Error ejecutando LOAD CSV'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
