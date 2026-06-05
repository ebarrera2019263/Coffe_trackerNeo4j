import neo4j, { Driver, Integer, Node, Relationship } from 'neo4j-driver'

declare global {
  var _neo4jDriver: Driver | undefined
}

function getDriver(): Driver {
  if (!global._neo4jDriver) {
    global._neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    )
  }
  return global._neo4jDriver
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({
    database: process.env.NEO4J_DATABASE,
  })
  try {
    const result = await session.run(cypher, params)
    return result.records.map((r) => serializeValue(r.toObject()) as T)
  } finally {
    await session.close()
  }
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value

  // Duck-type: Neo4j Integer — has {low: number, high: number}
  if (
    typeof value === 'object' &&
    'low' in (value as Record<string, unknown>) &&
    'high' in (value as Record<string, unknown>) &&
    typeof (value as { low: unknown }).low === 'number' &&
    typeof (value as { high: unknown }).high === 'number' &&
    !('labels' in (value as Record<string, unknown>)) // not a Node
  ) {
    const { low, high } = value as { low: number; high: number }
    if (high === 0) return low
    if (high === -1 && low < 0) return low
    const n = high * 4294967296 + (low >>> 0)
    return n >= Number.MIN_SAFE_INTEGER && n <= Number.MAX_SAFE_INTEGER ? n : n.toString()
  }

  // Duck-type: Neo4j Node — has {labels: string[], properties: {}, elementId: string}
  if (
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>).labels) &&
    'properties' in (value as Record<string, unknown>) &&
    'elementId' in (value as Record<string, unknown>)
  ) {
    return serializeValue((value as { properties: unknown }).properties)
  }

  // Duck-type: Neo4j Relationship — has {type: string, properties: {}, elementId: string}
  if (
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).type === 'string' &&
    'properties' in (value as Record<string, unknown>) &&
    'elementId' in (value as Record<string, unknown>) &&
    'start' in (value as Record<string, unknown>)
  ) {
    return serializeValue((value as { properties: unknown }).properties)
  }

  // Neo4j Integer (Int64) — instanceof fallback
  if (value instanceof Integer) {
    return value.inSafeRange() ? value.toNumber() : value.toString()
  }

  // Neo4j Node → devolver solo sus properties
  if (value instanceof Node) {
    return serializeValue(value.properties)
  }

  // Neo4j Relationship → devolver solo sus properties
  if (value instanceof Relationship) {
    return serializeValue(value.properties)
  }

  // Neo4j temporal types → ISO string via .toString()
  if (
    neo4j.isDate(value) ||
    neo4j.isDateTime(value) ||
    neo4j.isLocalDateTime(value) ||
    neo4j.isLocalTime(value) ||
    neo4j.isTime(value) ||
    neo4j.isDuration(value)
  ) {
    return (value as { toString(): string }).toString()
  }

  // Neo4j Point (spatial)
  if (neo4j.isPoint(value)) {
    const p = value as { x: number; y: number; z?: number }
    return p.z !== undefined ? { x: p.x, y: p.y, z: p.z } : { x: p.x, y: p.y }
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  // Plain objects (record, properties map, etc.)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeValue(v),
      ])
    )
  }

  return value
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDriver().verifyConnectivity()
    return true
  } catch {
    return false
  }
}
