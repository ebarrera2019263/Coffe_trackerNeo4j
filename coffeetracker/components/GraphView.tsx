'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface ApiNode {
  id: string
  label: string
  name: string
  codigo: string | null
}
interface ApiLink {
  source: string
  target: string
  type: string
}

interface GraphNode extends ApiNode {
  degree: number
  x?: number
  y?: number
}

// Paleta categórica validada (scripts/validate_palette.js del skill dataviz):
// pasa banda de luminosidad, croma, separación CVD y contraste ≥3:1 sobre #faf7f2.
const TYPE_STYLE: Record<string, { color: string; label: string }> = {
  Productor: { color: '#a34c15', label: 'Producer' },
  Transporte: { color: '#2f7fb8', label: 'Transport' },
  Finca: { color: '#279a66', label: 'Farm' },
  Certificacion: { color: '#993062', label: 'Certification' },
  Lote: { color: '#b8740e', label: 'Batch' },
  Cafeteria: { color: '#6d5bbf', label: 'Coffee Shop' },
  Beneficio: { color: '#0793ab', label: 'Wet Mill' },
  Tostador: { color: '#b0402f', label: 'Roaster' },
}
const FALLBACK = { color: '#8a6244', label: 'Other' }

export default function GraphView() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [data, setData] = useState<{ nodes: ApiNode[]; links: ApiLink[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/graph')
      .then((res) => {
        if (!res.ok) throw new Error('Error loading graph')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] }
    const degree = new Map<string, number>()
    for (const l of data.links) {
      degree.set(l.source, (degree.get(l.source) || 0) + 1)
      degree.set(l.target, (degree.get(l.target) || 0) + 1)
    }
    const visible = new Set(
      data.nodes.filter((n) => !hidden.has(n.label)).map((n) => n.id)
    )
    return {
      nodes: data.nodes
        .filter((n) => visible.has(n.id))
        .map((n) => ({ ...n, degree: degree.get(n.id) || 0 })),
      links: data.links
        .filter((l) => visible.has(l.source) && visible.has(l.target))
        .map((l) => ({ ...l })),
    }
  }, [data, hidden])

  const counts = useMemo(() => {
    const c = new Map<string, number>()
    for (const n of data?.nodes || []) c.set(n.label, (c.get(n.label) || 0) + 1)
    return c
  }, [data])

  function toggleType(label: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const nodeRadius = useCallback(
    (n: GraphNode) => 3 + Math.min(9, Math.sqrt(n.degree)),
    []
  )

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const style = TYPE_STYLE[node.label] || FALLBACK
      const r = nodeRadius(node)
      ctx.beginPath()
      ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI)
      ctx.fillStyle = style.color
      ctx.fill()
      ctx.lineWidth = 1.5 / globalScale
      ctx.strokeStyle = '#faf7f2'
      ctx.stroke()

      // Etiqueta directa al acercar el zoom (encoding secundario, no solo color)
      if (globalScale > 2.2) {
        const fontSize = 11 / globalScale
        ctx.font = `600 ${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#2a1608'
        ctx.fillText(node.name, node.x!, node.y! + r + 2 / globalScale)
      }
    },
    [nodeRadius]
  )

  if (error) {
    return (
      <div style={{ padding: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            borderRadius: 12,
            background: '#fdeceb',
            border: '1px solid #f2c4c0',
            color: '#a13a2f',
            fontSize: 14,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error} — Verify that
          Neo4j AuraDB is available and the credentials are correct.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Leyenda con filtros por tipo */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--white)',
        }}
      >
        {Object.entries(TYPE_STYLE).map(([label, style]) => {
          const off = hidden.has(label)
          return (
            <button
              key={label}
              onClick={() => toggleType(label)}
              title={off ? `Show ${style.label}` : `Hide ${style.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${off ? 'var(--border)' : style.color}`,
                background: off ? 'var(--cream-mid)' : 'var(--white)',
                color: off ? 'var(--text-light)' : 'var(--text-body)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: off ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: off ? 'var(--text-pale)' : style.color,
                }}
              />
              {style.label}
              <span style={{ fontWeight: 400, color: 'var(--text-mid)' }}>
                {counts.get(label) ?? 0}
              </span>
            </button>
          )
        })}
        <span
          style={{
            marginLeft: 'auto',
            alignSelf: 'center',
            fontSize: 12.5,
            color: 'var(--text-mid)',
          }}
        >
          Drag to move · scroll to zoom · click a batch to trace it
        </span>
      </div>

      {/* Lienzo del grafo */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, background: 'var(--cream)' }}>
        {!data ? (
          <CoffeeLoader text="Loading graph…" />
        ) : (
          size.width > 0 && (
            <ForceGraph2D
              width={size.width}
              height={size.height}
              graphData={graphData}
              nodeLabel={(n) => {
                const node = n as GraphNode
                const style = TYPE_STYLE[node.label] || FALLBACK
                return `<div style="padding:2px 4px"><b>${style.label}</b><br/>${node.name}${
                  node.label === 'Lote' ? '<br/><i>Click to view traceability</i>' : ''
                }</div>`
              }}
              nodeCanvasObject={(n, ctx, scale) => drawNode(n as GraphNode, ctx, scale)}
              nodePointerAreaPaint={(n, color, ctx) => {
                const node = n as GraphNode
                ctx.beginPath()
                ctx.arc(node.x!, node.y!, nodeRadius(node) + 3, 0, 2 * Math.PI)
                ctx.fillStyle = color
                ctx.fill()
              }}
              linkColor={() => 'rgba(107,58,32,0.16)'}
              linkWidth={1}
              linkDirectionalArrowLength={2.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={(n) => {
                const node = n as GraphNode
                if (node.label === 'Lote' && node.codigo) {
                  router.push(`/trazabilidad/${encodeURIComponent(node.codigo)}`)
                }
              }}
              cooldownTicks={200}
              warmupTicks={60}
            />
          )
        )}
      </div>
    </div>
  )
}
